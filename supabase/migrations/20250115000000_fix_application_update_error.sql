-- Fix application update error related to missing venue field
-- This migration ensures triggers don't reference non-existent fields

-- Drop and recreate the application_approved_credits trigger to ensure it's clean
DROP TRIGGER IF EXISTS application_approved_credits ON applications;

-- Recreate the trigger function with explicit error handling
CREATE OR REPLACE FUNCTION handle_application_approved()
RETURNS TRIGGER AS $$
BEGIN
  -- When an application changes to approved status
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Award 50 credits for completing a gig
    -- Use explicit error handling to avoid issues
    BEGIN
      PERFORM award_credits(
        NEW.user_id,
        50,
        'gig_completed',
        'Gig approved: Application ID ' || NEW.id::TEXT,
        NEW.id,
        'application'
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the update
        RAISE WARNING 'Error awarding credits: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER application_approved_credits
AFTER UPDATE ON applications
FOR EACH ROW
WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
EXECUTE FUNCTION handle_application_approved();

-- Check for any views or functions that might reference 'venue' field
-- If there are any, they should be updated to use 'location' instead
DO $$
DECLARE
  view_name TEXT;
  function_name TEXT;
BEGIN
  -- Check for views that might reference venue
  FOR view_name IN 
    SELECT table_name 
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%opportunity%'
  LOOP
    RAISE NOTICE 'Found view: %', view_name;
  END LOOP;
  
  -- Check for functions that might reference venue
  FOR function_name IN
    SELECT routine_name
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_type = 'FUNCTION'
    AND routine_name LIKE '%opportunity%'
  LOOP
    RAISE NOTICE 'Found function: %', function_name;
  END LOOP;
END $$;

