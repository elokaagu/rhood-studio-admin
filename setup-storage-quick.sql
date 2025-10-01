-- Quick Storage Setup for Opportunities Images
-- Copy and paste this into your Supabase SQL Editor and run it

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'opportunities',
  'opportunities', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Public read access for opportunities bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'opportunities');

-- Create policy for authenticated users to upload
CREATE POLICY "Authenticated upload to opportunities bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'opportunities' 
  AND auth.role() = 'authenticated'
);

-- Create policy for authenticated users to update
CREATE POLICY "Authenticated update opportunities bucket" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'opportunities' 
  AND auth.role() = 'authenticated'
);

-- Create policy for authenticated users to delete
CREATE POLICY "Authenticated delete opportunities bucket" ON storage.objects
FOR DELETE USING (
  bucket_id = 'opportunities' 
  AND auth.role() = 'authenticated'
);
