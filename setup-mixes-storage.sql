-- Setup Mixes Storage Bucket
-- Run this in your Supabase SQL Editor
-- This bucket stores both audio files (mixes) and artwork images

-- Create or update mixes bucket for storing mix audio files and artwork
-- Allow both audio files (mp3, wav, m4a, etc.) and image files (jpg, png, webp)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mixes',
  'mixes', 
  true,
  104857600, -- 100MB limit (for audio files, images are limited to 5MB in the app)
  ARRAY[
    -- Audio MIME types
    'audio/mpeg', 'audio/mp3', 'audio/mpeg3', 'audio/x-mpeg-3',
    'audio/wav', 'audio/wave', 'audio/x-wav',
    'audio/mp4', 'audio/m4a', 'audio/x-m4a',
    'audio/ogg', 'audio/vorbis',
    'audio/webm',
    'audio/aac',
    'audio/flac',
    -- Image MIME types
    'image/jpeg', 'image/jpg', 'image/pjpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600,
  allowed_mime_types = ARRAY[
    'audio/mpeg', 'audio/mp3', 'audio/mpeg3', 'audio/x-mpeg-3',
    'audio/wav', 'audio/wave', 'audio/x-wav',
    'audio/mp4', 'audio/m4a', 'audio/x-m4a',
    'audio/ogg', 'audio/vorbis',
    'audio/webm',
    'audio/aac',
    'audio/flac',
    'image/jpeg', 'image/jpg', 'image/pjpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ];

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Public read access for mixes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload to mixes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update mixes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete mixes bucket" ON storage.objects;

-- Create policies for mixes bucket
-- Public read access (anyone can view/list mixes)
CREATE POLICY "Public read access for mixes bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'mixes');

-- Authenticated users can upload (both audio and images)
CREATE POLICY "Authenticated upload to mixes bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'mixes' 
  AND auth.role() = 'authenticated'
);

-- Authenticated users can update
CREATE POLICY "Authenticated update mixes bucket" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'mixes' 
  AND auth.role() = 'authenticated'
);

-- Authenticated users can delete
CREATE POLICY "Authenticated delete mixes bucket" ON storage.objects
FOR DELETE USING (
  bucket_id = 'mixes' 
  AND auth.role() = 'authenticated'
);

-- Verify the setup
SELECT 
  'Mixes Bucket Status' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'mixes') 
    THEN '✅ Bucket exists' 
    ELSE '❌ Bucket missing' 
  END as result
UNION ALL
SELECT 
  'Public Access' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'mixes' AND public = true) 
    THEN '✅ Public access enabled' 
    ELSE '❌ Public access disabled' 
  END as result
UNION ALL
SELECT 
  'Upload Policy' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'objects' 
      AND policyname = 'Authenticated upload to mixes bucket'
    ) 
    THEN '✅ Upload policy exists' 
    ELSE '❌ Upload policy missing' 
  END as result;


