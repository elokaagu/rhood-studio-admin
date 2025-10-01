-- Setup Communities Storage Bucket
-- Run this in your Supabase SQL Editor

-- Create communities bucket for storing community images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'communities',
  'communities', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Public read access for communities bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload to communities bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update communities bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete communities bucket" ON storage.objects;

-- Create policies for communities bucket
CREATE POLICY "Public read access for communities bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'communities');

CREATE POLICY "Authenticated upload to communities bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'communities' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated update communities bucket" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'communities' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated delete communities bucket" ON storage.objects
FOR DELETE USING (
  bucket_id = 'communities' 
  AND auth.role() = 'authenticated'
);

-- Verify the setup
SELECT 
  'Communities Bucket Status' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'communities') 
    THEN '✅ Bucket exists' 
    ELSE '❌ Bucket missing' 
  END as result
UNION ALL
SELECT 
  'Public Access' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM storage.buckets 
      WHERE id = 'communities' AND public = true
    ) 
    THEN '✅ Bucket is public' 
    ELSE '❌ Bucket is not public' 
  END as result
UNION ALL
SELECT 
  'Policies Count' as check_type,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM pg_policies 
      WHERE tablename = 'objects' 
      AND qual LIKE '%communities%'
    ) >= 4
    THEN '✅ All policies created' 
    ELSE '❌ Missing policies' 
  END as result;
