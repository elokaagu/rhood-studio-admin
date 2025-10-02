-- Debug FUTURE BEATS Community Image
-- Run this in your Supabase SQL Editor

-- First, let's check what columns exist in the communities table
SELECT 
  'Table Schema Check' as check_type,
  column_name || ' (' || data_type || ')' as result
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'communities'
ORDER BY ordinal_position;

-- Then check if FUTURE BEATS community exists
SELECT 
  'FUTURE BEATS Community Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM communities 
      WHERE name ILIKE '%future beats%' OR name ILIKE '%future%'
    ) 
    THEN '✅ Community exists' 
    ELSE '❌ Community not found' 
  END as result

UNION ALL

-- Check all communities with images
SELECT 
  'Communities with Images' as check_type,
  COUNT(*)::text || ' communities have images' as result
FROM communities 
WHERE image_url IS NOT NULL

UNION ALL

-- Show all communities (without ordering since we don't know the column names)
SELECT 
  'Community: ' || name as check_type,
  CASE 
    WHEN image_url IS NOT NULL THEN 'Has image: ' || LEFT(image_url, 50) || '...'
    ELSE 'No image'
  END as result
FROM communities 
LIMIT 5;
