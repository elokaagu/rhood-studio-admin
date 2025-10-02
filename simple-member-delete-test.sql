-- Simple Member Delete Test
-- Run this in your Supabase SQL Editor

-- 1. First, let's try to delete a member directly
-- Replace the UUID with an actual member ID from your user_profiles table

-- Test deletion of a specific user (uncomment and replace UUID)
-- DELETE FROM user_profiles 
-- WHERE id = 'cc00a0ac-9163-4c30-b123-81cc06046e8b';

-- 2. Check if we can select from user_profiles (to verify permissions)
SELECT 
  'Can Select User Profiles' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM user_profiles LIMIT 1) 
    THEN '✅ Can select' 
    ELSE '❌ Cannot select' 
  END as result

UNION ALL

-- 3. Check if we can insert into user_profiles (to verify permissions)
SELECT 
  'Can Insert User Profiles' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_privileges 
      WHERE table_name = 'user_profiles' 
      AND privilege_type = 'INSERT'
    ) 
    THEN '✅ Can insert' 
    ELSE '❌ Cannot insert' 
  END as result

UNION ALL

-- 4. Check current user context
SELECT 
  'Current User' as check_type,
  COALESCE(auth.uid()::text, 'NULL - No auth context') as result

UNION ALL

-- 5. Show user profiles with their IDs
SELECT 
  'Profile: ' || COALESCE(first_name || ' ' || last_name, email, 'Unknown') as check_type,
  'ID: ' || id as result
FROM user_profiles 
LIMIT 3;
