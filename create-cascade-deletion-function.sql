-- Create a function to delete user with cascade deletion
-- This will handle all foreign key constraints properly

CREATE OR REPLACE FUNCTION delete_user_with_cascade(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Delete from all tables that reference user_profiles.id
  -- in the correct order to avoid foreign key violations
  
  -- 1. Delete from community_members
  DELETE FROM community_members WHERE user_id = user_id_param;
  
  -- 2. Delete from messages
  DELETE FROM messages WHERE sender_id = user_id_param;
  
  -- 3. Delete from applications
  DELETE FROM applications WHERE user_id = user_id_param;
  
  -- 4. Delete from connections (both directions)
  DELETE FROM connections WHERE follower_id = user_id_param;
  DELETE FROM connections WHERE following_id = user_id_param;
  
  -- 5. Finally delete the user profile
  DELETE FROM user_profiles WHERE id = user_id_param;
  
  -- Log the deletion
  RAISE NOTICE 'User % deleted successfully with cascade', user_id_param;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting user %: %', user_id_param, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_with_cascade(UUID) TO authenticated;

-- Test the function (optional - uncomment to test)
-- SELECT delete_user_with_cascade('your-test-user-id-here');
