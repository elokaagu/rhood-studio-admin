-- Manual user deletion script for Eloka user
-- Run this directly in Supabase SQL editor to delete the user and all related data

-- User ID for eloka@rhood.io: dfee6a12-a337-46f9-8bf0-307b4262f60f

-- Step 1: Delete from all related tables first
DELETE FROM community_members WHERE user_id = 'dfee6a12-a337-46f9-8bf0-307b4262f60f';
DELETE FROM messages WHERE sender_id = 'dfee6a12-a337-46f9-8bf0-307b4262f60f';
DELETE FROM applications WHERE user_id = 'dfee6a12-a337-46f9-8bf0-307b4262f60f';

-- Delete from message_threads table (this was causing the constraint error)
DELETE FROM message_threads WHERE participant_1 = 'dfee6a12-a337-46f9-8bf0-307b4262f60f';
DELETE FROM message_threads WHERE participant_2 = 'dfee6a12-a337-46f9-8bf0-307b4262f60f';

-- Step 2: Handle connections table (try different approaches)
-- Approach 1: Try standard deletion
DELETE FROM connections WHERE follower_id = 'dfee6a12-a337-46f9-8bf0-307b4262f60f';
DELETE FROM connections WHERE following_id = 'dfee6a12-a337-46f9-8bf0-307b4262f60f';

-- Approach 2: If above fails, try disabling constraint temporarily
-- ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_follower_id_fkey;
-- ALTER TABLE connections DROP CONSTRAINT IF EXISTS connections_following_id_fkey;
-- DELETE FROM connections WHERE follower_id = 'dfee6a12-a337-46f9-8bf0-307b4262f60f' OR following_id = 'dfee6a12-a337-46f9-8bf0-307b4262f60f';
-- -- Note: You'll need to recreate constraints after deletion if you use this approach

-- Step 3: Finally delete the user profile
DELETE FROM user_profiles WHERE id = 'dfee6a12-a337-46f9-8bf0-307b4262f60f';

-- Verify deletion
SELECT 'Deletion completed. Checking remaining references...' as status;
SELECT COUNT(*) as remaining_community_members FROM community_members WHERE user_id = 'dfee6a12-a337-46f9-8bf0-307b4262f60f';
SELECT COUNT(*) as remaining_messages FROM messages WHERE sender_id = 'dfee6a12-a337-46f9-8bf0-307b4262f60f';
SELECT COUNT(*) as remaining_applications FROM applications WHERE user_id = 'dfee6a12-a337-46f9-8bf0-307b4262f60f';
SELECT COUNT(*) as remaining_message_threads FROM message_threads WHERE participant_1 = 'dfee6a12-a337-46f9-8bf0-307b4262f60f' OR participant_2 = 'dfee6a12-a337-46f9-8bf0-307b4262f60f';
SELECT COUNT(*) as remaining_connections FROM connections WHERE follower_id = 'dfee6a12-a337-46f9-8bf0-307b4262f60f' OR following_id = 'dfee6a12-a337-46f9-8bf0-307b4262f60f';
SELECT COUNT(*) as remaining_user_profiles FROM user_profiles WHERE id = 'dfee6a12-a337-46f9-8bf0-307b4262f60f';
