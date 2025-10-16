-- Comprehensive chat data debugging script
-- Run this to see what's actually in the chat-related tables

-- 1. Check if messages table exists and its structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'messages' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check all messages in the database
SELECT 
    id,
    content,
    sender_id,
    community_id,
    created_at,
    edited_at
FROM messages 
ORDER BY created_at DESC;

-- 3. Check communities and their IDs
SELECT 
    id,
    name,
    description,
    created_at
FROM communities 
ORDER BY created_at DESC;

-- 4. Check community_members to see who's in which community
SELECT 
    cm.community_id,
    c.name as community_name,
    cm.user_id,
    up.first_name,
    up.last_name,
    up.email,
    cm.joined_at
FROM community_members cm
JOIN communities c ON cm.community_id = c.id
JOIN user_profiles up ON cm.user_id = up.id
ORDER BY c.name, up.first_name;

-- 5. Check messages with community names
SELECT 
    m.id,
    m.content,
    m.sender_id,
    c.name as community_name,
    up.first_name || ' ' || up.last_name as sender_name,
    m.created_at
FROM messages m
LEFT JOIN communities c ON m.community_id = c.id
LEFT JOIN user_profiles up ON m.sender_id = up.id
ORDER BY m.created_at DESC;

-- 6. Check if there are any RLS policies blocking access
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
WHERE tablename IN ('messages', 'communities', 'community_members', 'user_profiles')
ORDER BY tablename, policyname;

-- 7. Check message counts per community
SELECT 
    c.id,
    c.name as community_name,
    COUNT(m.id) as message_count,
    MAX(m.created_at) as last_message_date
FROM communities c
LEFT JOIN messages m ON c.id = m.community_id
GROUP BY c.id, c.name
ORDER BY message_count DESC;

-- 8. Check if there are any messages without proper sender_id or community_id
SELECT 
    id,
    content,
    sender_id,
    community_id,
    created_at,
    CASE 
        WHEN sender_id IS NULL THEN 'MISSING SENDER_ID'
        WHEN community_id IS NULL THEN 'MISSING COMMUNITY_ID'
        ELSE 'VALID'
    END as status
FROM messages
ORDER BY created_at DESC;

-- 9. Check user_profiles for potential sender issues
SELECT 
    id,
    first_name,
    last_name,
    email,
    created_at
FROM user_profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 10. Test a simple message insert (commented out for safety)
-- INSERT INTO messages (content, sender_id, community_id) 
-- VALUES ('Test message from admin', (SELECT id FROM user_profiles LIMIT 1), (SELECT id FROM communities LIMIT 1));
