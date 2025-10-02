-- Simple DELETE Policy Fix for Communities
-- Run this in your Supabase SQL Editor

-- 1. Drop any existing DELETE policies
DROP POLICY IF EXISTS "Community creators can delete their communities" ON public.communities;
DROP POLICY IF EXISTS "Admins can delete any community" ON public.communities;

-- 2. Create a simple DELETE policy - allow authenticated users to delete communities they created
CREATE POLICY "Users can delete their own communities" 
ON public.communities 
FOR DELETE 
TO authenticated
USING (auth.uid() = created_by);

-- 3. Alternative: Allow all authenticated users to delete any community (for testing)
-- Uncomment the line below if you want to allow anyone to delete communities
-- CREATE POLICY "Any authenticated user can delete communities" ON public.communities FOR DELETE TO authenticated USING (true);

-- 4. Verify the policy was created
SELECT 
  'DELETE Policy Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'communities' 
      AND policyname = 'Users can delete their own communities'
    ) 
    THEN '✅ DELETE policy exists' 
    ELSE '❌ DELETE policy missing' 
  END as result

UNION ALL

-- 5. Show current user
SELECT 
  'Current User ID' as check_type,
  auth.uid()::text as result

UNION ALL

-- 6. Show communities and their creators
SELECT 
  'Community: ' || id as check_type,
  'Created by: ' || COALESCE(created_by::text, 'NULL') as result
FROM communities
LIMIT 5;
