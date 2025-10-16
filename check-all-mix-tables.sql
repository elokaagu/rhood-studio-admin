-- Check all tables that might contain mix data
-- Run this to see what tables exist and which one has the actual mix data

-- List all tables in the database
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND (table_name ILIKE '%mix%' OR table_name ILIKE '%audio%' OR table_name ILIKE '%music%')
ORDER BY table_name;

-- Check if there are other tables with mix-related data
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND (column_name ILIKE '%mix%' OR column_name ILIKE '%audio%' OR column_name ILIKE '%file%' OR column_name ILIKE '%url%')
ORDER BY table_name, column_name;

-- Check the actual data in the mixes table
SELECT 
    COUNT(*) as total_mixes,
    COUNT(image_url) as mixes_with_images,
    COUNT(CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 1 END) as mixes_with_valid_images
FROM mixes;

-- Show all mixes with their image URLs
SELECT 
    id,
    title,
    artist,
    image_url,
    CASE 
        WHEN image_url IS NULL THEN 'NULL'
        WHEN image_url = '' THEN 'EMPTY'
        WHEN image_url LIKE '%unsplash%' THEN 'UNSPLASH'
        ELSE 'CUSTOM'
    END as image_type,
    created_at
FROM mixes 
ORDER BY created_at DESC;
