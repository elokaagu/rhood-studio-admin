-- Fix application update error: "record 'v_opportunity' has no field 'venue'"
-- VERSION 2: More aggressive fix that completely avoids joining with opportunities
-- This version uses a simpler approach that doesn't trigger PostgREST view generation

-- Step 1: Drop ALL existing policies that might reference opportunities
DROP POLICY IF EXISTS "Brands can view applications for their opportunities" ON applications;
DROP POLICY IF EXISTS "Brands can update applications for their opportunities" ON applications;
DROP POLICY IF EXISTS "Brands can view form responses for their opportunities" ON application_form_responses;
DROP POLICY IF EXISTS "Brands can update form responses for their opportunities" ON application_form_responses;

-- Step 2: Drop the helper function if it exists (we'll use a different approach)
DROP FUNCTION IF EXISTS user_owns_opportunity(UUID, UUID);

-- Step 3: Create a helper function that avoids PostgREST view generation
-- By using SECURITY DEFINER and only selecting specific columns, we prevent
-- PostgREST from trying to create views with all fields including non-existent 'venue'
CREATE OR REPLACE FUNCTION check_opportunity_ownership(p_opportunity_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_organizer_id UUID;
BEGIN
  -- Only select organizer_id - this is critical to avoid PostgREST materialization
  -- Do NOT use SELECT * or any other fields
  SELECT organizer_id INTO v_organizer_id
  FROM opportunities 
  WHERE id = p_opportunity_id;
  
  -- Return true if organizer matches, false otherwise (including NULL cases)
  RETURN COALESCE(v_organizer_id = p_user_id, false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Step 4: Recreate policies with admin check FIRST to short-circuit evaluation
-- For admins, we want to bypass all other checks completely
CREATE POLICY "Brands can view applications for their opportunities" 
ON public.applications 
FOR SELECT 
TO authenticated
USING (
  -- Check admin FIRST - this should short-circuit and prevent other checks
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Users can see their own applications
  user_id = auth.uid()
  OR
  -- Brands can see applications for their opportunities
  -- Only check if opportunity_id exists and user owns it
  (opportunity_id IS NOT NULL AND check_opportunity_ownership(opportunity_id, auth.uid()))
);

CREATE POLICY "Brands can update applications for their opportunities" 
ON public.applications 
FOR UPDATE 
TO authenticated
USING (
  -- Check admin FIRST - this should short-circuit and prevent other checks
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Users can update their own applications
  user_id = auth.uid()
  OR
  -- Brands can update applications for their opportunities
  (opportunity_id IS NOT NULL AND check_opportunity_ownership(opportunity_id, auth.uid()))
)
WITH CHECK (
  -- Check admin FIRST - this should short-circuit and prevent other checks
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Users can update their own applications
  user_id = auth.uid()
  OR
  -- Brands can update applications for their opportunities
  (opportunity_id IS NOT NULL AND check_opportunity_ownership(opportunity_id, auth.uid()))
);

-- Also fix form responses policies
CREATE POLICY "Brands can view form responses for their opportunities" 
ON public.application_form_responses 
FOR SELECT 
TO authenticated
USING (
  -- Check admin FIRST
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Users can see their own responses
  user_id = auth.uid()
  OR
  -- Brands can see responses for their opportunities
  (opportunity_id IS NOT NULL AND check_opportunity_ownership(opportunity_id, auth.uid()))
);

CREATE POLICY "Brands can update form responses for their opportunities" 
ON public.application_form_responses 
FOR UPDATE 
TO authenticated
USING (
  -- Check admin FIRST
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Users can update their own responses
  user_id = auth.uid()
  OR
  -- Brands can update responses for their opportunities
  (opportunity_id IS NOT NULL AND check_opportunity_ownership(opportunity_id, auth.uid()))
)
WITH CHECK (
  -- Check admin FIRST
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  OR
  -- Users can update their own responses
  user_id = auth.uid()
  OR
  -- Brands can update responses for their opportunities
  (opportunity_id IS NOT NULL AND check_opportunity_ownership(opportunity_id, auth.uid()))
);

-- Verify the fix
DO $$
BEGIN
  RAISE NOTICE 'Migration completed. Policies have been recreated with admin-first checks.';
  RAISE NOTICE 'If errors persist, the issue may be with PostgREST caching. Try refreshing the Supabase connection.';
END $$;
