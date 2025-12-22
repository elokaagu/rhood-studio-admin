-- ULTIMATE FIX for venue field error
-- This version uses the simplest possible approach: admin policies that don't reference anything
-- and brand policies that use a cached approach to avoid PostgREST materialization

-- Step 1: Drop ALL existing policies and functions
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Admins can insert applications" ON applications;
DROP POLICY IF EXISTS "Admins can update applications" ON applications;
DROP POLICY IF EXISTS "Admins can delete applications" ON applications;
DROP POLICY IF EXISTS "Brands can view applications for their opportunities" ON applications;
DROP POLICY IF EXISTS "Brands can update applications for their opportunities" ON applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON applications;
DROP POLICY IF EXISTS "Brands can view form responses for their opportunities" ON application_form_responses;
DROP POLICY IF EXISTS "Brands can update form responses for their opportunities" ON application_form_responses;

-- Drop functions with CASCADE to remove all dependencies
DROP FUNCTION IF EXISTS user_owns_opportunity(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS check_opportunity_ownership(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS is_opportunity_owner(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_opportunity_organizer(UUID) CASCADE;

-- Step 2: Create a simple admin check function that doesn't join anything
-- This function only checks user_profiles, never touches opportunities
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM user_profiles 
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(v_role = 'admin', false);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Step 3: Create admin policies using the simple function
-- These policies will be evaluated FIRST and will completely bypass opportunity checks
CREATE POLICY "Admins can view all applications" ON applications
  FOR SELECT 
  TO authenticated
  USING (is_admin_user());

CREATE POLICY "Admins can insert applications" ON applications
  FOR INSERT 
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update applications" ON applications
  FOR UPDATE 
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Admins can delete applications" ON applications
  FOR DELETE 
  TO authenticated
  USING (is_admin_user());

-- Step 4: Create user policies (for non-admins viewing their own applications)
CREATE POLICY "Users can view their own applications" ON applications
  FOR SELECT 
  TO authenticated
  USING (
    NOT is_admin_user()
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can create their own applications" ON applications
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    NOT is_admin_user()
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own applications" ON applications
  FOR UPDATE 
  TO authenticated
  USING (
    NOT is_admin_user()
    AND user_id = auth.uid()
  )
  WITH CHECK (
    NOT is_admin_user()
    AND user_id = auth.uid()
  );

-- Step 5: Create brand policies that use a minimal opportunity check
-- We'll use a function that ONLY selects organizer_id and returns it directly
CREATE OR REPLACE FUNCTION get_opportunity_organizer_id(p_opportunity_id UUID)
RETURNS UUID AS $$
DECLARE
  v_organizer_id UUID;
BEGIN
  -- CRITICAL: Only select organizer_id, nothing else
  -- This is the ONLY field we access from opportunities
  SELECT organizer_id INTO v_organizer_id
  FROM opportunities 
  WHERE id = p_opportunity_id
  LIMIT 1;
  
  RETURN v_organizer_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Brand policies that only apply to non-admins
CREATE POLICY "Brands can view applications for their opportunities" ON applications
  FOR SELECT 
  TO authenticated
  USING (
    NOT is_admin_user()
    AND (
      user_id = auth.uid()
      OR (
        opportunity_id IS NOT NULL 
        AND get_opportunity_organizer_id(opportunity_id) = auth.uid()
      )
    )
  );

CREATE POLICY "Brands can update applications for their opportunities" ON applications
  FOR UPDATE 
  TO authenticated
  USING (
    NOT is_admin_user()
    AND (
      user_id = auth.uid()
      OR (
        opportunity_id IS NOT NULL 
        AND get_opportunity_organizer_id(opportunity_id) = auth.uid()
      )
    )
  )
  WITH CHECK (
    NOT is_admin_user()
    AND (
      user_id = auth.uid()
      OR (
        opportunity_id IS NOT NULL 
        AND get_opportunity_organizer_id(opportunity_id) = auth.uid()
      )
    )
  );

-- Step 6: Fix form responses similarly
CREATE POLICY "Brands can view form responses for their opportunities" ON application_form_responses
  FOR SELECT 
  TO authenticated
  USING (
    is_admin_user()
    OR (
      NOT is_admin_user()
      AND (
        user_id = auth.uid()
        OR (
          opportunity_id IS NOT NULL 
          AND get_opportunity_organizer_id(opportunity_id) = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Brands can update form responses for their opportunities" ON application_form_responses
  FOR UPDATE 
  TO authenticated
  USING (
    is_admin_user()
    OR (
      NOT is_admin_user()
      AND (
        user_id = auth.uid()
        OR (
          opportunity_id IS NOT NULL 
          AND get_opportunity_organizer_id(opportunity_id) = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    is_admin_user()
    OR (
      NOT is_admin_user()
      AND (
        user_id = auth.uid()
        OR (
          opportunity_id IS NOT NULL 
          AND get_opportunity_organizer_id(opportunity_id) = auth.uid()
        )
      )
    )
  );

-- Step 7: Verification and instructions
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ULTIMATE VENUE FIELD FIX APPLIED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Key changes:';
  RAISE NOTICE '1. Admin policies use is_admin_user() - NO opportunity joins';
  RAISE NOTICE '2. Brand policies only apply to non-admins';
  RAISE NOTICE '3. get_opportunity_organizer_id() ONLY selects organizer_id';
  RAISE NOTICE '4. All functions use SECURITY DEFINER to avoid RLS issues';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Wait 10-15 seconds for PostgREST to refresh';
  RAISE NOTICE '2. Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)';
  RAISE NOTICE '3. Clear browser cache if needed';
  RAISE NOTICE '4. Try approving an application again';
  RAISE NOTICE '';
  RAISE NOTICE 'If still failing, check:';
  RAISE NOTICE '- Your user has role = ''admin'' in user_profiles table';
  RAISE NOTICE '- No other policies exist that might conflict';
  RAISE NOTICE '========================================';
END $$;
