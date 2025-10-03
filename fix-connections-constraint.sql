-- Fix the connections table foreign key constraint issue
-- This script will help us understand and fix the problem

-- 1. First, let's check the actual structure of the connections table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'connections'
ORDER BY ordinal_position;

-- 2. Check the foreign key constraints on connections table
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'connections'
ORDER BY tc.constraint_name;

-- 3. Check what data exists in connections table
SELECT COUNT(*) as total_connections FROM connections;

-- 4. Sample connections data to see the structure
SELECT * FROM connections LIMIT 5;

-- 5. Check if there are connections for the specific user we're trying to delete
-- Replace 'dfee6a12-a337-46f9-8bf0-307b4262f60f' with the actual user ID
SELECT * FROM connections 
WHERE follower_id = 'dfee6a12-a337-46f9-8bf0-307b4262f60f' 
   OR following_id = 'dfee6a12-a337-46f9-8bf0-307b4262f60f';

-- 6. Create a better cascade deletion function
CREATE OR REPLACE FUNCTION delete_user_with_cascade(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
    connection_count INTEGER;
BEGIN
  -- Log the start
  RAISE NOTICE 'Starting deletion for user: %', user_id_param;
  
  -- Check how many connections exist
  SELECT COUNT(*) INTO connection_count 
  FROM connections 
  WHERE follower_id = user_id_param OR following_id = user_id_param;
  
  RAISE NOTICE 'Found % connections for user %', connection_count, user_id_param;
  
  -- Delete from all tables that reference user_profiles.id
  -- in the correct order to avoid foreign key violations
  
  -- 1. Delete from community_members
  DELETE FROM community_members WHERE user_id = user_id_param;
  RAISE NOTICE 'Deleted community_members for user %', user_id_param;
  
  -- 2. Delete from messages
  DELETE FROM messages WHERE sender_id = user_id_param;
  RAISE NOTICE 'Deleted messages for user %', user_id_param;
  
  -- 3. Delete from applications
  DELETE FROM applications WHERE user_id = user_id_param;
  RAISE NOTICE 'Deleted applications for user %', user_id_param;
  
  -- 4. Delete from connections (both directions) with explicit handling
  DELETE FROM connections WHERE follower_id = user_id_param;
  RAISE NOTICE 'Deleted follower connections for user %', user_id_param;
  
  DELETE FROM connections WHERE following_id = user_id_param;
  RAISE NOTICE 'Deleted following connections for user %', user_id_param;
  
  -- 5. Finally delete the user profile
  DELETE FROM user_profiles WHERE id = user_id_param;
  RAISE NOTICE 'Deleted user profile for user %', user_id_param;
  
  RAISE NOTICE 'User % deleted successfully with cascade', user_id_param;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error deleting user %: % (SQLSTATE: %)', user_id_param, SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_with_cascade(UUID) TO authenticated;

-- Test the function (uncomment to test with actual user ID)
-- SELECT delete_user_with_cascade('dfee6a12-a337-46f9-8bf0-307b4262f60f');
