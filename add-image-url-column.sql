-- Add missing image_url column to mixes table
-- Run this in Supabase SQL Editor to fix the artwork display issue

-- First, check the current schema of the mixes table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'mixes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add the image_url column to the mixes table
ALTER TABLE mixes 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN mixes.image_url IS 'URL to the mix artwork/cover image';

-- Check the updated schema
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'mixes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Update any existing mixes with placeholder artwork URLs (optional)
-- You can customize these URLs or leave them NULL for now
UPDATE mixes 
SET image_url = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center'
WHERE image_url IS NULL 
  AND title ILIKE '%soulection%';

-- Verify the changes
SELECT 
  id,
  title,
  artist,
  image_url,
  created_at,
  status
FROM mixes 
ORDER BY created_at DESC
LIMIT 5;
