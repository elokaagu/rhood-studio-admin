-- Debug the connections table structure and foreign key constraints

-- Check if connections table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'connections'
ORDER BY ordinal_position;

-- Check foreign key constraints on connections table
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'connections';

-- Check what data exists in connections table
SELECT COUNT(*) as total_connections FROM connections;

-- Sample some connections data to see the structure
SELECT * FROM connections LIMIT 5;

-- Check if there are any connections referencing the user we're trying to delete
-- (Replace 'USER_ID_HERE' with the actual user ID you're trying to delete)
-- SELECT * FROM connections 
-- WHERE follower_id = 'USER_ID_HERE' OR following_id = 'USER_ID_HERE';
