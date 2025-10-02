-- Fix Member Deletion Issues
-- Run this in your Supabase SQL Editor

-- 1. Check current RLS policies on user_profiles
SELECT 
  'Current RLS Policies' as check_type,
  policyname || ' (' || cmd || ')' as result
FROM pg_policies 
WHERE tablename = 'user_profiles'

UNION ALL

-- 2. Check if RLS is enabled
SELECT 
  'RLS Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_class 
      WHERE relname = 'user_profiles' 
      AND relrowsecurity = true
    ) 
    THEN '✅ RLS enabled' 
    ELSE '❌ RLS disabled' 
  END as result

UNION ALL

-- 3. Show user profiles count
SELECT 
  'User Profiles Count' as check_type,
  COUNT(*)::text || ' total profiles' as result
FROM user_profiles;

-- 4. Create a temporary DELETE policy for user_profiles (if needed)
-- This allows any authenticated user to delete user profiles
-- Comment out the lines below if you don't want to create this policy

-- DROP POLICY IF EXISTS "Users can delete user profiles" ON public.user_profiles;
-- CREATE POLICY "Users can delete user profiles" 
-- ON public.user_profiles 
-- FOR DELETE 
-- TO authenticated
-- USING (true);

-- 5. Test deletion with a specific user (replace with actual user ID)
-- SELECT 
--   'Test Deletion' as check_type,
--   'Attempting to delete user: ' || id as result
-- FROM user_profiles 
-- WHERE email = 'eloka@rhood.io'
-- LIMIT 1;
