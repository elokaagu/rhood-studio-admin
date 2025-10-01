-- Diagnostic Queries for Image Issues
-- Run these in your Supabase SQL Editor to check the current state

-- 1. Check if opportunities bucket exists
SELECT name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'opportunities';

-- 2. Check current image URLs in opportunities table
SELECT id, title, image_url, 
       CASE 
         WHEN image_url IS NULL THEN 'No image'
         WHEN image_url LIKE 'https://%' THEN 'Valid URL format'
         ELSE 'Invalid URL format'
       END as url_status
FROM opportunities 
ORDER BY created_at DESC;

-- 3. Check storage policies for opportunities bucket
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' 
AND qual LIKE '%opportunities%';

-- 4. List files in opportunities bucket (if any exist)
SELECT name, bucket_id, owner, created_at, updated_at, metadata
FROM storage.objects 
WHERE bucket_id = 'opportunities';

-- 5. Fix invalid image URLs (run this if you see invalid URLs)
-- UPDATE opportunities 
-- SET image_url = NULL 
-- WHERE image_url IS NOT NULL 
-- AND image_url NOT LIKE 'https://%';

-- 6. Check for opportunities with broken image URLs
SELECT id, title, image_url
FROM opportunities 
WHERE image_url IS NOT NULL 
AND image_url NOT LIKE 'https://%.supabase.co/storage/v1/object/public/%';
