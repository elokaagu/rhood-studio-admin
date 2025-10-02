-- Verify Communities Table Setup
-- Run this in your Supabase SQL Editor to check if the communities table exists and is properly configured

-- Check if communities table exists
SELECT 
  'Communities Table Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'communities'
    ) 
    THEN '✅ Table exists' 
    ELSE '❌ Table missing' 
  END as result

UNION ALL

-- Check table structure
SELECT 
  'Table Columns' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'communities'
      AND column_name = 'id'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'communities'
      AND column_name = 'name'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'communities'
      AND column_name = 'created_by'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'communities'
      AND column_name = 'image_url'
    )
    THEN '✅ All required columns exist' 
    ELSE '❌ Missing required columns' 
  END as result

UNION ALL

-- Check RLS status
SELECT 
  'RLS Status' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_class 
      WHERE relname = 'communities' 
      AND relrowsecurity = true
    ) 
    THEN '✅ RLS enabled' 
    ELSE '❌ RLS disabled' 
  END as result

UNION ALL

-- Check policies
SELECT 
  'Policies Count' as check_type,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM pg_policies 
      WHERE tablename = 'communities'
    ) >= 3
    THEN '✅ All policies exist' 
    ELSE '❌ Missing policies' 
  END as result

UNION ALL

-- Check if we can insert (this will fail if there are issues)
SELECT 
  'Insert Test' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'communities' 
      AND policyname = 'Authenticated users can create communities'
    ) 
    THEN '✅ Insert policy exists' 
    ELSE '❌ Insert policy missing' 
  END as result;

-- Show current communities count
SELECT 
  'Current Communities' as info,
  COUNT(*) as count
FROM communities;

-- Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'communities'
ORDER BY ordinal_position;
