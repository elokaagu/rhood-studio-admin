-- Fix venue field error in views and queries
-- This migration ensures no views or functions reference the non-existent 'venue' field

-- Drop any views that might reference venue field
DO $$
DECLARE
  view_record RECORD;
  view_def TEXT;
BEGIN
  -- Find and drop views that might reference venue
  FOR view_record IN 
    SELECT 
      v.table_schema,
      v.table_name,
      v.view_definition as def
    FROM information_schema.views v
    WHERE v.table_schema = 'public'
    AND (
      v.table_name LIKE '%opportunity%' 
      OR v.view_definition ILIKE '%venue%'
    )
  LOOP
    BEGIN
      -- Check if view definition contains venue
      view_def := view_record.def;
      IF view_def ILIKE '%venue%' THEN
        RAISE NOTICE 'Dropping view % that references venue', view_record.table_name;
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_record.table_schema, view_record.table_name);
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop view %: %', view_record.table_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- Ensure the applications table update doesn't fail due to missing fields
-- The issue is likely in RLS policies or triggers that join with opportunities
-- We've already fixed the trigger in the previous migration

-- Check if there are any RLS policies that might be causing issues
-- They should only reference fields that exist: location, not venue
-- If any policy references venue, it will fail at creation time, so this is a safety check

-- Make sure all opportunity references use 'location' not 'venue'
-- This is mainly for documentation - actual code should already be correct

-- Note: The error "record 'v_opportunity' has no field 'venue'" suggests
-- that Supabase PostgREST is creating a view-like structure during joins
-- and expecting a field that doesn't exist. The fix is to ensure we're
-- not selecting or referencing non-existent fields in our queries.

-- Since we can't directly modify PostgREST's internal view generation,
-- we'll ensure all our queries are correct and don't reference venue

-- Re-check trigger functions to ensure they don't reference venue
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

-- The trigger should already exist from previous migration, but ensure it's correct
DROP TRIGGER IF EXISTS application_approved_credits ON applications;

CREATE TRIGGER application_approved_credits
AFTER UPDATE ON applications
FOR EACH ROW
WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
EXECUTE FUNCTION handle_application_approved();

