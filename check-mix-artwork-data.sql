-- Check what image data exists in the mixes table
-- Run this to see what artwork URLs are actually stored

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
    END as image_type,
    created_at,
    status
FROM mixes 
ORDER BY created_at DESC;

-- Also check if there are any other image-related columns
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'mixes' 
  AND table_schema = 'public'
  AND (column_name ILIKE '%image%' OR column_name ILIKE '%artwork%' OR column_name ILIKE '%cover%')
ORDER BY column_name;
