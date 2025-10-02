-- Temporary DELETE Policy for User Profiles
-- Run this in your Supabase SQL Editor

-- 1. Drop any existing DELETE policy
DROP POLICY IF EXISTS "Users can delete user profiles" ON public.user_profiles;

-- 2. Create a temporary policy that allows any authenticated user to delete user profiles
CREATE POLICY "Users can delete user profiles" 
ON public.user_profiles 
FOR DELETE 
TO authenticated
USING (true);

-- 3. Verify the policy was created
SELECT 
  'DELETE Policy Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'user_profiles' 
      AND policyname = 'Users can delete user profiles'
    ) 
    THEN '✅ DELETE policy exists' 
    ELSE '❌ DELETE policy missing' 
  END as result

UNION ALL

-- 4. Show all policies on user_profiles
SELECT 
  'Policy: ' || policyname as check_type,
  'Command: ' || cmd as result
FROM pg_policies 
WHERE tablename = 'user_profiles'

UNION ALL

-- 5. Show user profiles count
SELECT 
  'User Profiles Count' as check_type,
  COUNT(*)::text || ' total profiles' as result
FROM user_profiles;
