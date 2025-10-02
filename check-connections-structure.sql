-- Quick check of connections table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'connections'
ORDER BY ordinal_position;

-- Check if there are any connections records
SELECT COUNT(*) as total_connections FROM connections;

-- Sample some connections data
SELECT * FROM connections LIMIT 3;
