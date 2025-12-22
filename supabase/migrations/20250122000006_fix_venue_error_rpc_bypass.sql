-- FINAL SOLUTION: Use RPC function to bypass RLS for admin updates
-- This completely avoids PostgREST trying to materialize opportunity views

-- Step 1: Create an RPC function that admins can call to update applications
-- This function runs with SECURITY DEFINER, so it bypasses RLS
CREATE OR REPLACE FUNCTION admin_update_application_status(
  p_application_id UUID,
  p_new_status TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_role TEXT;
  v_result JSONB;
BEGIN
  -- Check if user is admin
  SELECT role INTO v_user_role
  FROM user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  IF v_user_role != 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins can use this function'
    );
  END IF;
  
  -- Update the application directly (bypasses RLS)
  UPDATE applications
  SET 
    status = p_new_status,
    updated_at = NOW()
  WHERE id = p_application_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Application not found'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Application updated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Grant execute permission to authenticated users
-- (The function itself checks for admin role)
GRANT EXECUTE ON FUNCTION admin_update_application_status(UUID, TEXT) TO authenticated;

-- Step 3: Also create a function for form responses
-- Note: This function uses p_application_id for consistency with the code
CREATE OR REPLACE FUNCTION admin_update_form_response_status(
  p_application_id UUID,
  p_new_status TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_role TEXT;
BEGIN
  -- Check if user is admin
  SELECT role INTO v_user_role
  FROM user_profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  IF v_user_role != 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only admins can use this function'
    );
  END IF;
  
  -- Update the form response directly (bypasses RLS)
  UPDATE application_form_responses
  SET 
    status = p_new_status,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_application_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Form response not found'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Form response updated successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION admin_update_form_response_status(UUID, TEXT) TO authenticated;

-- Step 4: Verification
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RPC BYPASS FUNCTIONS CREATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Created functions:';
  RAISE NOTICE '1. admin_update_application_status(application_id, status)';
  RAISE NOTICE '2. admin_update_form_response_status(response_id, status)';
  RAISE NOTICE '';
  RAISE NOTICE 'These functions bypass RLS completely for admins';
  RAISE NOTICE 'The application code needs to be updated to use these functions';
  RAISE NOTICE '========================================';
END $$;
