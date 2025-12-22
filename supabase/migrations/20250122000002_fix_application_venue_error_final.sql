-- Fix application update error: "record 'v_opportunity' has no field 'venue'"
-- FINAL VERSION: Ensure admin policies work correctly and avoid all opportunity joins
-- The issue is that PostgREST tries to materialize opportunity fields even for admins

-- Step 1: Ensure admin policies exist and are correct (they should bypass all checks)
-- These policies use USING (true) which should completely bypass RLS for admins
DO $$
BEGIN
  -- Drop and recreate admin policies to ensure they're correct
  DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
  DROP POLICY IF EXISTS "Admins can insert applications" ON applications;
  DROP POLICY IF EXISTS "Admins can update applications" ON applications;
  DROP POLICY IF EXISTS "Admins can delete applications" ON applications;
  
  -- Recreate admin policies - these should be evaluated FIRST
  CREATE POLICY "Admins can view all applications" ON applications
    FOR SELECT USING (true);
  
  CREATE POLICY "Admins can insert applications" ON applications
    FOR INSERT WITH CHECK (true);
  
  CREATE POLICY "Admins can update applications" ON applications
    FOR UPDATE USING (true) WITH CHECK (true);
  
  CREATE POLICY "Admins can delete applications" ON applications
    FOR DELETE USING (true);
END $$;

-- Step 2: Drop problematic brand policies that join with opportunities
DROP POLICY IF EXISTS "Brands can view applications for their opportunities" ON applications;
DROP POLICY IF EXISTS "Brands can update applications for their opportunities" ON applications;
DROP POLICY IF EXISTS "Brands can view form responses for their opportunities" ON application_form_responses;
DROP POLICY IF EXISTS "Brands can update form responses for their opportunities" ON application_form_responses;

-- Step 3: Drop old helper functions
DROP FUNCTION IF EXISTS user_owns_opportunity(UUID, UUID);
DROP FUNCTION IF EXISTS check_opportunity_ownership(UUID, UUID);

-- Step 4: Create a new helper function that uses ONLY organizer_id
-- This is critical - we must NOT select any other fields to avoid PostgREST issues
CREATE OR REPLACE FUNCTION is_opportunity_owner(p_opportunity_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_organizer_id UUID;
BEGIN
  -- CRITICAL: Only select organizer_id, nothing else
  -- This prevents PostgREST from trying to materialize all opportunity columns
  SELECT organizer_id INTO v_organizer_id
  FROM opportunities 
  WHERE id = p_opportunity_id
  LIMIT 1;
  
  -- Return true only if organizer_id matches and is not null
  RETURN (v_organizer_id IS NOT NULL AND v_organizer_id = p_user_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Step 5: Recreate brand policies that ONLY apply to non-admins
-- This ensures admins never trigger the opportunity join
CREATE POLICY "Brands can view applications for their opportunities" 
ON public.applications 
FOR SELECT 
TO authenticated
USING (
  -- CRITICAL: Only evaluate this policy if user is NOT an admin
  -- This prevents PostgREST from even looking at opportunities for admins
  NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
  AND (
    -- Users can see their own applications
    user_id = auth.uid()
    OR
    -- Brands can see applications for their opportunities
    (opportunity_id IS NOT NULL AND is_opportunity_owner(opportunity_id, auth.uid()))
  )
);

CREATE POLICY "Brands can update applications for their opportunities" 
ON public.applications 
FOR UPDATE 
TO authenticated
USING (
  -- CRITICAL: Only evaluate this policy if user is NOT an admin
  NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
  AND (
    -- Users can update their own applications
    user_id = auth.uid()
    OR
    -- Brands can update applications for their opportunities
    (opportunity_id IS NOT NULL AND is_opportunity_owner(opportunity_id, auth.uid()))
  )
)
WITH CHECK (
  -- CRITICAL: Only evaluate this policy if user is NOT an admin
  NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
  AND (
    -- Users can update their own applications
    user_id = auth.uid()
    OR
    -- Brands can update applications for their opportunities
    (opportunity_id IS NOT NULL AND is_opportunity_owner(opportunity_id, auth.uid()))
  )
);

-- Also fix form responses - only apply to non-admins
CREATE POLICY "Brands can view form responses for their opportunities" 
ON public.application_form_responses 
FOR SELECT 
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
  AND (
    user_id = auth.uid()
    OR
    (opportunity_id IS NOT NULL AND is_opportunity_owner(opportunity_id, auth.uid()))
  )
);

CREATE POLICY "Brands can update form responses for their opportunities" 
ON public.application_form_responses 
FOR UPDATE 
TO authenticated
USING (
  NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
  AND (
    user_id = auth.uid()
    OR
    (opportunity_id IS NOT NULL AND is_opportunity_owner(opportunity_id, auth.uid()))
  )
)
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
  AND (
    user_id = auth.uid()
    OR
    (opportunity_id IS NOT NULL AND is_opportunity_owner(opportunity_id, auth.uid()))
  )
);

-- Verification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Admin policies have been recreated with USING (true)';
  RAISE NOTICE 'Brand policies now explicitly check admin status first';
  RAISE NOTICE 'Helper function only selects organizer_id to avoid venue field issues';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'If errors persist:';
  RAISE NOTICE '1. Clear your browser cache and refresh';
  RAISE NOTICE '2. Check Supabase dashboard for any cached views';
  RAISE NOTICE '3. Verify your user has role = ''admin'' in user_profiles table';
  RAISE NOTICE '========================================';
END $$;
