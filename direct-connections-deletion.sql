-- Direct approach to delete user and all related data
-- This will work regardless of foreign key constraints

-- First, let's see what's actually in the connections table
SELECT 'connections_table_structure' as info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'connections' ORDER BY ordinal_position;

SELECT 'connections_data_sample' as info;
SELECT * FROM connections LIMIT 5;

-- Now let's delete everything for a specific user
-- Replace 'USER_ID_HERE' with the actual user ID you want to delete

-- Method 1: Direct SQL deletion (run this in Supabase SQL editor)
/*
DELETE FROM community_members WHERE user_id = 'USER_ID_HERE';
DELETE FROM messages WHERE sender_id = 'USER_ID_HERE';
DELETE FROM applications WHERE user_id = 'USER_ID_HERE';
DELETE FROM connections WHERE follower_id = 'USER_ID_HERE';
DELETE FROM connections WHERE following_id = 'USER_ID_HERE';
DELETE FROM user_profiles WHERE id = 'USER_ID_HERE';
*/

-- Method 2: Check what connections exist for a user
SELECT 'checking_connections_for_user' as info;
-- Replace 'USER_ID_HERE' with actual user ID
-- SELECT * FROM connections WHERE follower_id = 'USER_ID_HERE' OR following_id = 'USER_ID_HERE';

-- Method 3: Force delete with CASCADE (if constraints allow)
-- ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_follower_id_fkey;
-- ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_following_id_fkey;
-- Then delete the user
-- DELETE FROM user_profiles WHERE id = 'USER_ID_HERE';
-- Then recreate constraints if needed
