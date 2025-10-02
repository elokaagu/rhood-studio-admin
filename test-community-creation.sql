-- Test Community Creation
-- Run this in your Supabase SQL Editor to test if community creation works

-- First, check if you have a user profile
SELECT 
  'User Profile Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid()
    ) 
    THEN '✅ User profile exists' 
    ELSE '❌ User profile missing - create one first' 
  END as result;

-- Test community creation (this should work if everything is set up correctly)

-- Note: This will only work if you're authenticated and have a user profile
INSERT INTO communities (
  name,
  description,
  created_by,
  member_count
) VALUES (
  'Test Community ' || extract(epoch from now())::text,
  'This is a test community created to verify the setup works',
  auth.uid(),
  0
) RETURNING id, name, created_at;

-- If the above worked, clean up the test community
-- DELETE FROM communities WHERE name LIKE 'Test Community%';
