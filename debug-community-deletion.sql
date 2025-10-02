-- Debug Community Deletion Issues
-- Run this in your Supabase SQL Editor

-- 1. Check if DELETE policy exists
SELECT 
  'DELETE Policy Check' as check_type,
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

-- 2. Show all policies for communities table
SELECT 
  'All Communities Policies' as check_type,
  STRING_AGG(policyname, ', ') as result
FROM pg_policies 
WHERE tablename = 'communities'

UNION ALL

-- 3. Check current user
SELECT 
  'Current User' as check_type,
  auth.uid()::text as result

UNION ALL

-- 4. Check communities and their creators
SELECT 
  'Communities Count' as check_type,
  COUNT(*)::text as result
FROM communities

UNION ALL

-- 5. Show communities with creator info
SELECT 
  'Community ID: ' || id as check_type,
  'Created by: ' || COALESCE(created_by::text, 'NULL') as result
FROM communities
ORDER BY id
LIMIT 10;

-- 6. Test if current user can delete (this will show the policy result)
SELECT 
  'Can Delete Test' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM communities 
      WHERE id = 'bd870b94-5d44-4e06-afd2-eecbb604dec6'
      AND auth.uid() = created_by
    )
    THEN '✅ User can delete this community'
    ELSE '❌ User cannot delete this community (not creator or policy issue)'
  END as result;
