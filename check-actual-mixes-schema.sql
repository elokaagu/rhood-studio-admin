-- Check the actual schema of the mixes table that exists in the database
-- This will show us exactly what columns exist vs what the TypeScript types expect

-- Get the actual column structure of the mixes table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'mixes' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if there are multiple tables with similar names
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
  AND table_name ILIKE '%mix%'
ORDER BY table_name;

-- Check what data is actually in the mixes table
SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN file_url IS NOT NULL THEN 1 END) as has_file_url,
    COUNT(CASE WHEN title IS NOT NULL THEN 1 END) as has_title,
    COUNT(CASE WHEN artist IS NOT NULL THEN 1 END) as has_artist
FROM mixes;

-- Show sample data to see what columns actually exist
SELECT *
FROM mixes 
LIMIT 1;
