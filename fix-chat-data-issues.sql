-- Fix common chat data issues
-- Run this after debugging to resolve chat data problems

-- 1. Ensure messages table has proper structure
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE
);

-- 2. Ensure community_members table exists
CREATE TABLE IF NOT EXISTS community_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- 3. Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 4. Create admin-friendly policies for messages
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
CREATE POLICY "Admins can view all messages" ON messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert messages" ON messages;
CREATE POLICY "Admins can insert messages" ON messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can update messages" ON messages;
CREATE POLICY "Admins can update messages" ON messages
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Admins can delete messages" ON messages;
CREATE POLICY "Admins can delete messages" ON messages
  FOR DELETE USING (true);

-- 5. Enable RLS on community_members table
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- 6. Create admin-friendly policies for community_members
DROP POLICY IF EXISTS "Admins can view all community members" ON community_members;
CREATE POLICY "Admins can view all community members" ON community_members
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert community members" ON community_members;
CREATE POLICY "Admins can insert community members" ON community_members
  FOR INSERT WITH CHECK (true);

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_community_id ON messages(community_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);

-- 8. Add sample data if no messages exist
INSERT INTO messages (content, sender_id, community_id)
SELECT 
  'Welcome to the community!',
  up.id,
  c.id
FROM communities c
CROSS JOIN user_profiles up
WHERE NOT EXISTS (SELECT 1 FROM messages WHERE community_id = c.id)
LIMIT 1;

-- 9. Ensure community creators are members of their communities
INSERT INTO community_members (community_id, user_id)
SELECT 
  c.id,
  c.created_by
FROM communities c
WHERE c.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM community_members cm 
    WHERE cm.community_id = c.id AND cm.user_id = c.created_by
  );

-- 10. Add all user_profiles as members of the first community (if no members exist)
INSERT INTO community_members (community_id, user_id)
SELECT 
  (SELECT id FROM communities ORDER BY created_at LIMIT 1),
  up.id
FROM user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM community_members cm 
  WHERE cm.user_id = up.id
)
LIMIT 5; -- Limit to avoid too many members

-- 11. Verify the setup
SELECT 
  'Messages count' as table_name,
  COUNT(*) as count
FROM messages
UNION ALL
SELECT 
  'Community members count' as table_name,
  COUNT(*) as count
FROM community_members
UNION ALL
SELECT 
  'Communities count' as table_name,
  COUNT(*) as count
FROM communities;
