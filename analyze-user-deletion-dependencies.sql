-- Comprehensive analysis of user deletion dependencies
-- This will help us understand all foreign key relationships

-- 1. Check all tables that reference user_profiles.id
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'user_profiles'
    AND ccu.column_name = 'id'
ORDER BY tc.table_name, kcu.column_name;

-- 2. Check if connections table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('connections', 'connection')
ORDER BY table_name, ordinal_position;

-- 3. Check foreign key constraints on connections table (if it exists)
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
    AND tc.table_name IN ('connections', 'connection')
ORDER BY tc.table_name, kcu.column_name;

-- 4. Check RLS policies on user_profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 5. Sample data check - see what references a user
-- (This will show us what data exists that might prevent deletion)
SELECT 'community_members' as table_name, COUNT(*) as count FROM community_members WHERE user_id IS NOT NULL
UNION ALL
SELECT 'messages' as table_name, COUNT(*) as count FROM messages WHERE sender_id IS NOT NULL
UNION ALL  
SELECT 'applications' as table_name, COUNT(*) as count FROM applications WHERE user_id IS NOT NULL
UNION ALL
SELECT 'connections' as table_name, COUNT(*) as count FROM connections WHERE follower_id IS NOT NULL OR following_id IS NOT NULL;
