-- Fix application update error: "record 'v_opportunity' has no field 'venue'"
-- This error occurs when RLS policies or triggers try to access opportunities table
-- and PostgREST creates a view that expects a 'venue' field that doesn't exist

-- The issue is that the opportunities table uses 'location' not 'venue'
-- But something in the RLS policy evaluation is trying to access 'venue'

-- Root cause: When RLS policies join with opportunities table using EXISTS subqueries,
-- PostgREST may try to materialize all fields from opportunities, including non-existent 'venue'

-- Solution: Use a more efficient approach that doesn't trigger PostgREST view generation
-- by using a function or by restructuring the RLS policy to avoid the join

-- Step 1: Drop existing brand policies that might be causing issues
DROP POLICY IF EXISTS "Brands can view applications for their opportunities" ON applications;
DROP POLICY IF EXISTS "Brands can update applications for their opportunities" ON applications;
DROP POLICY IF EXISTS "Brands can view form responses for their opportunities" ON application_form_responses;
DROP POLICY IF EXISTS "Brands can update form responses for their opportunities" ON application_form_responses;

-- Create a helper function to check if user owns an opportunity
-- This avoids PostgREST trying to materialize all opportunity fields
CREATE OR REPLACE FUNCTION user_owns_opportunity(p_opportunity_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM opportunities 
    WHERE id = p_opportunity_id 
    AND organizer_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies using the helper function to avoid venue field issues
CREATE POLICY "Brands can view applications for their opportunities" 
ON public.applications 
FOR SELECT 
TO authenticated
USING (
  -- Admins can see all
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Users can see their own applications
  user_id = auth.uid()
  OR
  -- Brands can see applications for their opportunities
  -- Use helper function to avoid PostgREST view generation issues
  (opportunity_id IS NOT NULL AND user_owns_opportunity(opportunity_id, auth.uid()))
);

CREATE POLICY "Brands can update applications for their opportunities" 
ON public.applications 
FOR UPDATE 
TO authenticated
USING (
  -- Admins can update any
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Users can update their own applications
  user_id = auth.uid()
  OR
  -- Brands can update applications for their opportunities
  -- Use helper function to avoid PostgREST view generation issues
  (opportunity_id IS NOT NULL AND user_owns_opportunity(opportunity_id, auth.uid()))
)
WITH CHECK (
  -- Admins can update any
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Users can update their own applications
  user_id = auth.uid()
  OR
  -- Brands can update applications for their opportunities
  -- Use helper function to avoid PostgREST view generation issues
  (opportunity_id IS NOT NULL AND user_owns_opportunity(opportunity_id, auth.uid()))
);

-- Also fix form responses policies
CREATE POLICY "Brands can view form responses for their opportunities" 
ON public.application_form_responses 
FOR SELECT 
TO authenticated
USING (
  -- Admins can see all
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Users can see their own responses
  user_id = auth.uid()
  OR
  -- Brands can see responses for their opportunities
  (opportunity_id IS NOT NULL AND user_owns_opportunity(opportunity_id, auth.uid()))
);

CREATE POLICY "Brands can update form responses for their opportunities" 
ON public.application_form_responses 
FOR UPDATE 
TO authenticated
USING (
  -- Admins can update any
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Users can update their own responses
  user_id = auth.uid()
  OR
  -- Brands can update responses for their opportunities
  (opportunity_id IS NOT NULL AND user_owns_opportunity(opportunity_id, auth.uid()))
)
WITH CHECK (
  -- Admins can update any
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Users can update their own responses
  user_id = auth.uid()
  OR
  -- Brands can update responses for their opportunities
  (opportunity_id IS NOT NULL AND user_owns_opportunity(opportunity_id, auth.uid()))
);

-- Also ensure the trigger function doesn't cause issues
-- The trigger should already be correct, but let's make sure it's using the right approach
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

-- Ensure trigger exists and is correct
DROP TRIGGER IF EXISTS application_approved_credits ON applications;

CREATE TRIGGER application_approved_credits
AFTER UPDATE ON applications
FOR EACH ROW
WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
EXECUTE FUNCTION handle_application_approved();

-- Verify opportunities table structure
-- Make sure 'location' field exists and 'venue' does not
DO $$
BEGIN
  -- Check if venue column exists (it shouldn't)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'opportunities' 
    AND column_name = 'venue'
  ) THEN
    RAISE NOTICE 'WARNING: opportunities table has a venue column. This should be renamed to location.';
  END IF;
  
  -- Verify location column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'opportunities' 
    AND column_name = 'location'
  ) THEN
    RAISE NOTICE 'WARNING: opportunities table is missing location column.';
  END IF;
END $$;
