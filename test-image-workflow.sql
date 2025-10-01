-- Test Image Workflow - Run this after uploading an image
-- This will help verify that everything is working correctly

-- 1. Check if opportunities bucket exists and is properly configured
SELECT 
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'opportunities';

-- 2. Check storage policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND qual LIKE '%opportunities%'
ORDER BY policyname;

-- 3. Check recent opportunities with images
SELECT 
  id,
  title,
  image_url,
  CASE 
    WHEN image_url IS NULL THEN 'No image'
    WHEN image_url LIKE 'https://%.supabase.co/storage/v1/object/public/opportunities/%' THEN 'Valid URL'
    ELSE 'Invalid URL format'
  END as url_status,
  created_at
FROM opportunities 
WHERE image_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check files in storage bucket
SELECT 
  name,
  bucket_id,
  owner,
  created_at,
  updated_at,
  metadata->>'size' as file_size,
  metadata->>'mimetype' as mime_type
FROM storage.objects 
WHERE bucket_id = 'opportunities'
ORDER BY created_at DESC
LIMIT 10;

-- 5. Test URL accessibility (this will show if URLs are properly formatted)
SELECT 
  o.id,
  o.title,
  o.image_url,
  CASE 
    WHEN o.image_url LIKE 'https://%.supabase.co/storage/v1/object/public/opportunities/images/%' THEN '✅ Correct format'
    WHEN o.image_url IS NULL THEN '❌ No image'
    ELSE '❌ Invalid format'
  END as url_check
FROM opportunities o
WHERE o.image_url IS NOT NULL
ORDER BY o.created_at DESC;

-- 6. Count opportunities with and without images
SELECT 
  'Total Opportunities' as category,
  COUNT(*) as count
FROM opportunities
UNION ALL
SELECT 
  'With Images' as category,
  COUNT(*) as count
FROM opportunities
WHERE image_url IS NOT NULL AND image_url LIKE 'https://%.supabase.co/storage/v1/object/public/opportunities/%'
UNION ALL
SELECT 
  'Without Images' as category,
  COUNT(*) as count
FROM opportunities
WHERE image_url IS NULL OR image_url NOT LIKE 'https://%.supabase.co/storage/v1/object/public/opportunities/%';
