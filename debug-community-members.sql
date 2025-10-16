-- Debug community member counts
-- Run this to see the actual member counts for each community

-- Check if community_members table exists and has data
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'community_members' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show actual member counts per community
SELECT 
    c.id as community_id,
    c.name as community_name,
    COUNT(cm.user_id) as actual_member_count,
    c.member_count as stored_member_count,
    CASE 
        WHEN COUNT(cm.user_id) = c.member_count THEN 'MATCH'
        ELSE 'MISMATCH'
    END as count_status
FROM communities c
LEFT JOIN community_members cm ON c.id = cm.community_id
GROUP BY c.id, c.name, c.member_count
ORDER BY c.name;

-- Show individual community memberships
SELECT 
    c.name as community_name,
    up.first_name,
    up.last_name,
    up.email,
    cm.joined_at
FROM communities c
JOIN community_members cm ON c.id = cm.community_id
JOIN user_profiles up ON cm.user_id = up.id
ORDER BY c.name, up.first_name;

-- Check for communities with no members
SELECT 
    c.id,
    c.name,
    c.description,
    'NO MEMBERS' as status
FROM communities c
LEFT JOIN community_members cm ON c.id = cm.community_id
WHERE cm.user_id IS NULL;

-- Update stored member_count to match actual counts (if needed)
UPDATE communities 
SET member_count = (
    SELECT COUNT(*) 
    FROM community_members cm 
    WHERE cm.community_id = communities.id
)
WHERE id IN (
    SELECT DISTINCT community_id 
    FROM community_members
);
