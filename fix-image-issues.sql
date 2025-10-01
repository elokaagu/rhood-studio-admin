-- Fix Image Issues - Run this in Supabase SQL Editor

-- Step 1: Create opportunities bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'opportunities',
  'opportunities', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Step 2: Drop existing policies to recreate them
DROP POLICY IF EXISTS "Public read access for opportunities bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload to opportunities bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update opportunities bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete opportunities bucket" ON storage.objects;

-- Step 3: Create proper policies
CREATE POLICY "Public read access for opportunities bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'opportunities');

CREATE POLICY "Authenticated upload to opportunities bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'opportunities' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated update opportunities bucket" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'opportunities' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated delete opportunities bucket" ON storage.objects
FOR DELETE USING (
  bucket_id = 'opportunities' 
  AND auth.role() = 'authenticated'
);

-- Step 4: Clear any invalid image URLs
UPDATE opportunities 
SET image_url = NULL 
WHERE image_url IS NOT NULL 
AND (
  image_url NOT LIKE 'https://%' OR
  image_url NOT LIKE '%supabase.co%' OR
  image_url NOT LIKE '%/storage/v1/object/public/%'
);

-- Step 5: Verify the fix
SELECT 
  'Bucket Status' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'opportunities') 
    THEN 'Bucket exists' 
    ELSE 'Bucket missing' 
  END as result
UNION ALL
SELECT 
  'Public Access' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.buckets 
      WHERE id = 'opportunities' AND public = true
    ) 
    THEN 'Bucket is public' 
    ELSE 'Bucket is not public' 
  END as result
UNION ALL
SELECT 
  'Invalid URLs' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM opportunities 
      WHERE image_url IS NOT NULL 
      AND image_url NOT LIKE 'https://%.supabase.co/storage/v1/object/public/%'
    ) 
    THEN 'Found invalid URLs' 
    ELSE 'All URLs are valid or NULL' 
  END as result;
