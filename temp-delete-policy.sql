-- Temporary DELETE Policy for Testing
-- Run this in your Supabase SQL Editor

-- 1. Drop the existing policy
DROP POLICY IF EXISTS "Users can delete their own communities" ON public.communities;

-- 2. Create a temporary policy that allows any authenticated user to delete
CREATE POLICY "Temporary: Any authenticated user can delete communities" 
ON public.communities 
FOR DELETE 
TO authenticated
USING (true);

-- 3. Verify the policy was created
SELECT 
  'Temporary DELETE Policy Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'communities' 
      AND policyname = 'Temporary: Any authenticated user can delete communities'
    ) 
    THEN '✅ Temporary DELETE policy exists' 
    ELSE '❌ Temporary DELETE policy missing' 
  END as result

UNION ALL

-- 4. Show current user (should still be NULL in SQL editor)
SELECT 
  'Current User ID (SQL Editor)' as check_type,
  COALESCE(auth.uid()::text, 'NULL - This is normal in SQL editor') as result

UNION ALL

-- 5. Show communities count
SELECT 
  'Communities Count' as check_type,
  COUNT(*)::text as result
FROM communities;
