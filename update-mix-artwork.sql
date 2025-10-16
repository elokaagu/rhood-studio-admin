-- Update mix artwork URLs to remove Unsplash placeholders
-- Run this to set proper artwork URLs or remove placeholder URLs

-- First, check current image URLs
SELECT 
    id,
    title,
    artist,
    image_url,
    CASE 
        WHEN image_url IS NULL THEN 'NULL'
        WHEN image_url = '' THEN 'EMPTY STRING'
        WHEN image_url LIKE '%unsplash%' THEN 'UNSPLASH PLACEHOLDER'
        ELSE 'CUSTOM URL'
    END as image_type
FROM mixes 
ORDER BY created_at DESC;

-- Option 1: Remove all Unsplash placeholder URLs (set to NULL)
UPDATE mixes 
SET image_url = NULL 
WHERE image_url LIKE '%unsplash%';

-- Option 2: If you want to keep some placeholder images, you can set specific ones
-- Uncomment and modify these lines if you want to keep specific artwork:

-- UPDATE mixes 
-- SET image_url = '/placeholder.svg' 
-- WHERE title = 'Soulection 702' AND image_url LIKE '%unsplash%';

-- UPDATE mixes 
-- SET image_url = '/club-residency.jpg' 
-- WHERE title = 'Summer House Vibes' AND image_url LIKE '%unsplash%';

-- UPDATE mixes 
-- SET image_url = '/warehouse-rave.jpg' 
-- WHERE title = 'Drum & Bass Energy' AND image_url LIKE '%unsplash%';

-- UPDATE mixes 
-- SET image_url = '/neon-club.jpg' 
-- WHERE title = 'Deep House Journey' AND image_url LIKE '%unsplash%';

-- Verify the changes
SELECT 
    id,
    title,
    artist,
    image_url,
    CASE 
        WHEN image_url IS NULL THEN 'NULL - Will show music icon'
        WHEN image_url = '' THEN 'EMPTY STRING'
        WHEN image_url LIKE '%unsplash%' THEN 'UNSPLASH PLACEHOLDER'
        ELSE 'CUSTOM URL: ' || image_url
    END as image_status
FROM mixes 
ORDER BY created_at DESC;
