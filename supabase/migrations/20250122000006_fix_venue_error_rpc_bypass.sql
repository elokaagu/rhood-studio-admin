-- FINAL SOLUTION: Use RPC function to bypass RLS for admin updates
-- This completely avoids PostgREST trying to materialize opportunity views

-- Step 1: Drop existing functions if they exist (clean slate)
DROP FUNCTION IF EXISTS admin_update_application_status(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS admin_update_form_response_status(UUID, TEXT) CASCADE;

-- Step 2: Create an RPC function that admins can call to update applications
-- This function runs with SECURITY DEFINER, so it bypasses RLS
CREATE OR REPLACE FUNCTION admin_update_application_status(
  p_application_id UUID,
  p_new_status TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_application_exists BOOLEAN;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;
  
  -- Check if user is admin (handle NULL role)
  SELECT COALESCE(role, '') INTO v_user_role
  FROM user_profiles
  WHERE id = v_user_id
  LIMIT 1;
  
  -- If no user profile found or role is not admin
  IF v_user_role IS NULL OR v_user_role != 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Access denied. Your role is: %s. Only admins can use this function.', COALESCE(v_user_role, 'NULL or not set'))
    );
  END IF;
  
  -- Check if application exists
  SELECT EXISTS(SELECT 1 FROM applications WHERE id = p_application_id) INTO v_application_exists;
  
  IF NOT v_application_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Application not found'
    );
  END IF;
  
  -- Update the application directly (bypasses RLS)
  UPDATE applications
  SET 
    status = p_new_status,
    updated_at = NOW()
  WHERE id = p_application_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Application updated successfully',
    'application_id', p_application_id,
    'new_status', p_new_status
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Database error: %s', SQLERRM)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Grant execute permission to authenticated users
-- (The function itself checks for admin role)
GRANT EXECUTE ON FUNCTION admin_update_application_status(UUID, TEXT) TO authenticated;

-- Step 4: Create a function for form responses
CREATE OR REPLACE FUNCTION admin_update_form_response_status(
  p_application_id UUID,
  p_new_status TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_response_exists BOOLEAN;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;
  
  -- Check if user is admin (handle NULL role)
  SELECT COALESCE(role, '') INTO v_user_role
  FROM user_profiles
  WHERE id = v_user_id
  LIMIT 1;
  
  -- If no user profile found or role is not admin
  IF v_user_role IS NULL OR v_user_role != 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Access denied. Your role is: %s. Only admins can use this function.', COALESCE(v_user_role, 'NULL or not set'))
    );
  END IF;
  
  -- Check if form response exists
  SELECT EXISTS(SELECT 1 FROM application_form_responses WHERE id = p_application_id) INTO v_response_exists;
  
  IF NOT v_response_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Form response not found'
    );
  END IF;
  
  -- Update the form response directly (bypasses RLS)
  UPDATE application_form_responses
  SET 
    status = p_new_status,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_application_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Form response updated successfully',
    'response_id', p_application_id,
    'new_status', p_new_status
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Database error: %s', SQLERRM)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_update_form_response_status(UUID, TEXT) TO authenticated;

-- Step 6: Verification and helpful queries
DO $$
DECLARE
  v_current_user_id UUID;
  v_current_user_role TEXT;
BEGIN
  v_current_user_id := auth.uid();
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RPC BYPASS FUNCTIONS CREATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Created functions:';
  RAISE NOTICE '1. admin_update_application_status(application_id, status)';
  RAISE NOTICE '2. admin_update_form_response_status(response_id, status)';
  RAISE NOTICE '';
  RAISE NOTICE 'These functions bypass RLS completely for admins';
  RAISE NOTICE '';
  
  -- Check current user's role
  IF v_current_user_id IS NOT NULL THEN
    SELECT COALESCE(role, 'NULL') INTO v_current_user_role
    FROM user_profiles
    WHERE id = v_current_user_id
    LIMIT 1;
    
    RAISE NOTICE 'Current user ID: %', v_current_user_id;
    RAISE NOTICE 'Current user role: %', COALESCE(v_current_user_role, 'NOT FOUND');
    
    IF v_current_user_role != 'admin' THEN
      RAISE NOTICE '';
      RAISE NOTICE '⚠️  WARNING: Your role is not "admin"!';
      RAISE NOTICE 'To fix this, run:';
      RAISE NOTICE 'UPDATE user_profiles SET role = ''admin'' WHERE id = ''%'';', v_current_user_id;
    ELSE
      RAISE NOTICE '';
      RAISE NOTICE '✓ Your role is set to "admin" - you can use these functions!';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  No authenticated user found. Make sure you are logged in.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
