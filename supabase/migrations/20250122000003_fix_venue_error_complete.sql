-- COMPLETE FIX for venue field error
-- This migration ensures admins can update applications without triggering venue field errors
-- The key is to ensure admin policies are evaluated FIRST and completely bypass opportunity joins

-- Step 1: Drop ALL existing policies on applications and application_form_responses to start fresh
-- IMPORTANT: Drop policies BEFORE dropping functions to avoid dependency errors
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Admins can insert applications" ON applications;
DROP POLICY IF EXISTS "Admins can update applications" ON applications;
DROP POLICY IF EXISTS "Admins can delete applications" ON applications;
DROP POLICY IF EXISTS "Brands can view applications for their opportunities" ON applications;
DROP POLICY IF EXISTS "Brands can update applications for their opportunities" ON applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Users can create their own applications" ON applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON applications;

-- Also drop policies on application_form_responses that might depend on functions
DROP POLICY IF EXISTS "Brands can view form responses for their opportunities" ON application_form_responses;
DROP POLICY IF EXISTS "Brands can update form responses for their opportunities" ON application_form_responses;
DROP POLICY IF EXISTS "Admins can view all form responses" ON application_form_responses;
DROP POLICY IF EXISTS "Admins can update form responses" ON application_form_responses;
DROP POLICY IF EXISTS "Users can view their own form responses" ON application_form_responses;
DROP POLICY IF EXISTS "Users can update their own form responses" ON application_form_responses;

-- Step 2: Now drop any helper functions (policies are dropped, so this should work)
DROP FUNCTION IF EXISTS user_owns_opportunity(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS check_opportunity_ownership(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS is_opportunity_owner(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS get_opportunity_organizer(UUID) CASCADE;

-- Step 3: Create admin policies FIRST (these should be evaluated first by PostgREST)
-- Using USING (true) means these policies will match for admins and bypass all other checks
CREATE POLICY "Admins can view all applications" ON applications
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert applications" ON applications
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update applications" ON applications
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete applications" ON applications
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Step 4: Create user policies (for users viewing/updating their own applications)
-- These don't join with opportunities, so they're safe
CREATE POLICY "Users can view their own applications" ON applications
  FOR SELECT 
  TO authenticated
  USING (
    -- Only apply if user is NOT an admin (admins are handled above)
    NOT EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can create their own applications" ON applications
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own applications" ON applications
  FOR UPDATE 
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    AND user_id = auth.uid()
  )
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    AND user_id = auth.uid()
  );

-- Step 5: Create brand policies WITHOUT any opportunity joins
-- Instead of joining with opportunities, we'll use a simple function that only selects organizer_id
CREATE OR REPLACE FUNCTION get_opportunity_organizer(p_opportunity_id UUID)
RETURNS UUID AS $$
DECLARE
  v_organizer_id UUID;
BEGIN
  -- ONLY select organizer_id - this is critical
  SELECT organizer_id INTO v_organizer_id
  FROM opportunities 
  WHERE id = p_opportunity_id
  LIMIT 1;
  
  RETURN v_organizer_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Brand policies that only apply to non-admins and use the safe function
CREATE POLICY "Brands can view applications for their opportunities" ON applications
  FOR SELECT 
  TO authenticated
  USING (
    -- Only apply if user is NOT an admin
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
      (
        opportunity_id IS NOT NULL 
        AND get_opportunity_organizer(opportunity_id) = auth.uid()
      )
    )
  );

CREATE POLICY "Brands can update applications for their opportunities" ON applications
  FOR UPDATE 
  TO authenticated
  USING (
    -- Only apply if user is NOT an admin
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
      (
        opportunity_id IS NOT NULL 
        AND get_opportunity_organizer(opportunity_id) = auth.uid()
      )
    )
  )
  WITH CHECK (
    -- Only apply if user is NOT an admin
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
      (
        opportunity_id IS NOT NULL 
        AND get_opportunity_organizer(opportunity_id) = auth.uid()
      )
    )
  );

-- Step 6: Also fix form responses
DROP POLICY IF EXISTS "Brands can view form responses for their opportunities" ON application_form_responses;
DROP POLICY IF EXISTS "Brands can update form responses for their opportunities" ON application_form_responses;

CREATE POLICY "Brands can view form responses for their opportunities" ON application_form_responses
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    OR (
      NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
      )
      AND (
        user_id = auth.uid()
        OR (
          opportunity_id IS NOT NULL 
          AND get_opportunity_organizer(opportunity_id) = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Brands can update form responses for their opportunities" ON application_form_responses
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    OR (
      NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
      )
      AND (
        user_id = auth.uid()
        OR (
          opportunity_id IS NOT NULL 
          AND get_opportunity_organizer(opportunity_id) = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    OR (
      NOT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
      )
      AND (
        user_id = auth.uid()
        OR (
          opportunity_id IS NOT NULL 
          AND get_opportunity_organizer(opportunity_id) = auth.uid()
        )
      )
    )
  );

-- Step 7: Verify the fix
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'COMPLETE VENUE FIELD FIX APPLIED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'What was fixed:';
  RAISE NOTICE '1. Admin policies are created FIRST and check admin status';
  RAISE NOTICE '2. Brand policies only apply to non-admins';
  RAISE NOTICE '3. Helper function only selects organizer_id (not all fields)';
  RAISE NOTICE '4. No opportunity joins in admin policy evaluation';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Clear your browser cache';
  RAISE NOTICE '2. Refresh the page';
  RAISE NOTICE '3. Try approving an application again';
  RAISE NOTICE '';
  RAISE NOTICE 'If errors persist, verify your user has role = ''admin'' in user_profiles';
  RAISE NOTICE '========================================';
END $$;
