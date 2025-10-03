-- Manual user deletion script
-- Run this directly in Supabase SQL editor to delete a user and all related data

-- Replace 'USER_ID_HERE' with the actual user ID you want to delete
-- Example: 'dfee6a12-a337-46f9-8bf0-307b4262f60f'

-- Step 1: Delete from all related tables first
DELETE FROM community_members WHERE user_id = 'USER_ID_HERE';
DELETE FROM messages WHERE sender_id = 'USER_ID_HERE';
DELETE FROM applications WHERE user_id = 'USER_ID_HERE';

-- Step 2: Handle connections table (try different approaches)
-- Approach 1: Try standard deletion
DELETE FROM connections WHERE follower_id = 'USER_ID_HERE';
DELETE FROM connections WHERE following_id = 'USER_ID_HERE';

-- Approach 2: If above fails, try disabling constraint temporarily
-- ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_follower_id_fkey;
-- ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_following_id_fkey;
-- DELETE FROM connections WHERE follower_id = 'USER_ID_HERE' OR following_id = 'USER_ID_HERE';
-- -- Note: You'll need to recreate constraints after deletion if you use this approach

-- Step 3: Finally delete the user profile
DELETE FROM user_profiles WHERE id = 'USER_ID_HERE';

-- Verify deletion
SELECT 'Deletion completed. Checking remaining references...' as status;
SELECT COUNT(*) as remaining_community_members FROM community_members WHERE user_id = 'USER_ID_HERE';
SELECT COUNT(*) as remaining_messages FROM messages WHERE sender_id = 'USER_ID_HERE';
SELECT COUNT(*) as remaining_applications FROM applications WHERE user_id = 'USER_ID_HERE';
SELECT COUNT(*) as remaining_connections FROM connections WHERE follower_id = 'USER_ID_HERE' OR following_id = 'USER_ID_HERE';
SELECT COUNT(*) as remaining_user_profiles FROM user_profiles WHERE id = 'USER_ID_HERE';
