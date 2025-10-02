-- Debug FUTURE BEATS Community Image
-- Run this in your Supabase SQL Editor

-- 1. Check if FUTURE BEATS community exists
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

-- 2. Check all communities with images
SELECT 
  'Communities with Images' as check_type,
  COUNT(*)::text || ' communities have images' as result
FROM communities 
WHERE image_url IS NOT NULL

UNION ALL

-- 3. Show first few communities with their image status
SELECT 
  'Community: ' || name as check_type,
  CASE 
    WHEN image_url IS NOT NULL THEN 'Has image: ' || LEFT(image_url, 50) || '...'
    ELSE 'No image'
  END as result
FROM communities 
ORDER BY id DESC
LIMIT 5;

-- 4. Separate query for FUTURE BEATS details (if exists)
SELECT 
  'FUTURE BEATS Details' as check_type,
  'Name: ' || name || ', ID: ' || id || ', Has Image: ' || CASE WHEN image_url IS NOT NULL THEN 'YES (' || LEFT(image_url, 30) || '...)' ELSE 'NO' END as result
FROM communities 
WHERE name ILIKE '%future beats%' OR name ILIKE '%future%'
LIMIT 1;
