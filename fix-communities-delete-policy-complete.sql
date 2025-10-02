-- Complete Fix for Communities DELETE Policy
-- Run this in your Supabase SQL Editor

-- 1. Drop existing DELETE policy if it exists
DROP POLICY IF EXISTS "Community creators can delete their communities" ON public.communities;

-- 2. Create the DELETE policy
CREATE POLICY "Community creators can delete their communities" 
ON public.communities 
FOR DELETE 
TO authenticated
USING (auth.uid() = created_by);

-- 3. Also add a policy for admins to delete any community (if needed)
-- Note: This assumes there's a role field in user_profiles, adjust as needed
CREATE POLICY "Admins can delete any community" 
ON public.communities 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'Admin')
  )
);

-- 4. Verify policies were created
SELECT 
  'DELETE Policies Status' as check_type,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM pg_policies 
      WHERE tablename = 'communities' 
      AND policyname LIKE '%delete%'
    ) >= 1
    THEN '✅ DELETE policies exist' 
    ELSE '❌ DELETE policies missing' 
  END as result

UNION ALL

-- 5. Show all policies for communities table
SELECT 
  'All Communities Policies' as check_type,
  STRING_AGG(policyname, ', ') as result
FROM pg_policies 
WHERE tablename = 'communities'

UNION ALL

-- 6. Test current user permissions
SELECT 
  'Current User ID' as check_type,
  auth.uid()::text as result

UNION ALL

-- 7. Check if current user is admin
SELECT 
  'Is Admin' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR role = 'Admin')
    )
    THEN '✅ User is admin'
    ELSE '❌ User is not admin'
  END as result;
