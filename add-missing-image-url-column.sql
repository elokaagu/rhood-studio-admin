-- Add the missing image_url column to the mixes table
-- The migration created the table without image_url, but the code expects it

-- First, check what columns actually exist
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'mixes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add the missing image_url column
ALTER TABLE mixes 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN mixes.image_url IS 'URL to the mix artwork/cover image';

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mixes' 
  AND table_schema = 'public'
  AND column_name = 'image_url';

-- Check if there's any data in the table
SELECT 
    id,
    title,
    artist,
    image_url,
    created_at
FROM mixes 
ORDER BY created_at DESC
LIMIT 5;

-- If there are existing mixes without artwork, you can add placeholder URLs
-- UPDATE mixes 
-- SET image_url = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center'
-- WHERE image_url IS NULL;
