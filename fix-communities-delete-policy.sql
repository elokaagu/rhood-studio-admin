-- Fix Communities Delete Policy
-- Run this in your Supabase SQL Editor

-- Add DELETE policy for communities (creators can delete their own communities)
CREATE POLICY "Community creators can delete their communities" 
ON public.communities 
FOR DELETE 
TO authenticated
USING (auth.uid() = created_by);

-- Verify the policy was created
SELECT 
  'Communities DELETE Policy Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'communities' 
      AND policyname = 'Community creators can delete their communities'
    ) 
    THEN '✅ DELETE policy exists' 
    ELSE '❌ DELETE policy missing' 
  END as result

UNION ALL

-- Show all policies for communities table
SELECT 
  'All Communities Policies' as check_type,
  STRING_AGG(policyname, ', ') as result
FROM pg_policies 
WHERE tablename = 'communities';
