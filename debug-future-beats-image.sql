-- Debug FUTURE BEATS Community Image
-- Run this in your Supabase SQL Editor

-- 1. Check if FUTURE BEATS community exists and has an image
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

-- 2. Show FUTURE BEATS community details
SELECT 
  'Community Details' as check_type,
  'Name: ' || name || ', ID: ' || id || ', Has Image: ' || CASE WHEN image_url IS NOT NULL THEN 'YES' ELSE 'NO' END as result
FROM communities 
WHERE name ILIKE '%future beats%' OR name ILIKE '%future%'
LIMIT 1

UNION ALL

-- 3. Show the actual image URL if it exists
SELECT 
  'Image URL' as check_type,
  COALESCE(image_url, 'NULL - No image URL') as result
FROM communities 
WHERE name ILIKE '%future beats%' OR name ILIKE '%future%'
LIMIT 1

UNION ALL

-- 4. Check all communities with images
SELECT 
  'Communities with Images' as check_type,
  COUNT(*)::text || ' communities have images' as result
FROM communities 
WHERE image_url IS NOT NULL

UNION ALL

-- 5. Show first few communities with their image status
SELECT 
  'Community: ' || name as check_type,
  CASE 
    WHEN image_url IS NOT NULL THEN 'Has image: ' || LEFT(image_url, 50) || '...'
    ELSE 'No image'
  END as result
FROM communities 
ORDER BY created_at DESC
LIMIT 5;
