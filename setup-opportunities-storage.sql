-- Setup storage bucket for opportunity images
-- Run this SQL in your Supabase SQL Editor

-- Create storage bucket for opportunities
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'opportunities',
  'opportunities',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create policies for the opportunities bucket

-- Allow anyone to view opportunity images (public bucket)
CREATE POLICY "Opportunity images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'opportunities');

-- Allow authenticated users to upload opportunity images
CREATE POLICY "Authenticated users can upload opportunity images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'opportunities' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their own opportunity images
CREATE POLICY "Users can update opportunity images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'opportunities' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete opportunity images
CREATE POLICY "Users can delete opportunity images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'opportunities' 
  AND auth.role() = 'authenticated'
);
