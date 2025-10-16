-- Verify that the image_url column exists and check its data
-- Run this to confirm the column exists and see what data is in it

-- Check if the image_url column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'mixes' 
  AND table_schema = 'public'
  AND column_name = 'image_url';

-- If the above returns no results, the column doesn't exist
-- Check all columns in the mixes table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'mixes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what image data exists (this will fail if image_url column doesn't exist)
SELECT 
    id,
    title,
    artist,
    image_url,
    created_at
FROM mixes 
ORDER BY created_at DESC
LIMIT 5;
