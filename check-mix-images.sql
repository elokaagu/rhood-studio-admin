-- Check mix images in the database
-- Run this in Supabase SQL Editor

-- 1. Check if mixes have image_url values
SELECT 
    id,
    title,
    artist,
    CASE 
        WHEN image_url IS NULL THEN 'No image URL'
        WHEN image_url = '' THEN 'Empty image URL'
        ELSE image_url
    END as image_status,
    file_url,
    created_at
FROM mixes
ORDER BY created_at DESC;

-- 2. Count mixes with and without images
SELECT 
    COUNT(*) as total_mixes,
    COUNT(image_url) as mixes_with_images,
    COUNT(*) - COUNT(image_url) as mixes_without_images
FROM mixes;

-- 3. Check if there are any images in Supabase Storage
-- Note: This would need to be run from the Storage section or via Supabase client
-- For now, we'll just show what's in the database

SELECT 'Run the queries above to see the current state' as info;

