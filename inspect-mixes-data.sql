-- Inspect actual mix data to understand why images aren't showing
SELECT 
    id,
    title,
    artist,
    image_url,
    file_url,
    created_at
FROM mixes
ORDER BY created_at DESC;

-- Check if image_url is truly NULL or contains data
SELECT 
    title,
    artist,
    LENGTH(image_url) as image_url_length,
    CASE 
        WHEN image_url IS NULL THEN 'NULL'
        WHEN image_url = '' THEN 'Empty string'
        ELSE image_url
    END as actual_image_url_value
FROM mixes;

