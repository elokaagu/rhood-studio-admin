-- Check Communities Table Schema
-- Run this in your Supabase SQL Editor

-- 1. Check if communities table exists
SELECT 
  'Table Exists' as check_type,
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

-- 2. Show actual table structure
SELECT 
  'Column: ' || column_name as check_type,
  'Type: ' || data_type || ', Nullable: ' || is_nullable as result
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'communities'
ORDER BY ordinal_position

UNION ALL

-- 3. Show sample data (if any)
SELECT 
  'Sample Data' as check_type,
  'Count: ' || COUNT(*)::text as result
FROM communities

UNION ALL

-- 4. Show first few records with actual column names
SELECT 
  'Record ' || ROW_NUMBER() OVER (ORDER BY id) as check_type,
  'ID: ' || id as result
FROM communities
LIMIT 5;
