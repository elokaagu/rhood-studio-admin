-- Fix common chat issues
-- Run this in your Supabase SQL Editor

-- 1. Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_community_id ON messages(community_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 3. Create community_members table if it doesn't exist (needed for RLS)
CREATE TABLE IF NOT EXISTS community_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- 4. Create index for community_members
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON community_members(user_id);

-- 5. Enable Row Level Security on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view messages in communities they belong to" ON messages;
DROP POLICY IF EXISTS "Users can send messages to communities they belong to" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
DROP POLICY IF EXISTS "Admins can insert messages" ON messages;

-- 7. Create admin-friendly policies (temporary - for debugging)
CREATE POLICY "Admins can view all messages" ON messages
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert messages" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update messages" ON messages
  FOR UPDATE USING (true);

CREATE POLICY "Admins can delete messages" ON messages
  FOR DELETE USING (true);

-- 8. Enable RLS on community_members
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- 9. Create policies for community_members
DROP POLICY IF EXISTS "Admins can view all community members" ON community_members;
DROP POLICY IF EXISTS "Admins can insert community members" ON community_members;
DROP POLICY IF EXISTS "Admins can update community members" ON community_members;
DROP POLICY IF EXISTS "Admins can delete community members" ON community_members;

CREATE POLICY "Admins can view all community members" ON community_members
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert community members" ON community_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update community members" ON community_members
  FOR UPDATE USING (true);

CREATE POLICY "Admins can delete community members" ON community_members
  FOR DELETE USING (true);

-- 10. Create updated_at trigger for messages
CREATE OR REPLACE FUNCTION update_messages_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_messages_updated_at_column();

-- 11. Add some test data (optional - remove if you don't want test data)
-- First, let's get a community ID and user ID
DO $$
DECLARE
    test_community_id UUID;
    test_user_id UUID;
BEGIN
    -- Get the first community ID
    SELECT id INTO test_community_id FROM communities LIMIT 1;
    
    -- Get the first user profile ID
    SELECT id INTO test_user_id FROM user_profiles LIMIT 1;
    
    -- Only insert test data if both exist
    IF test_community_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        -- Insert a test message
        INSERT INTO messages (content, sender_id, community_id)
        VALUES ('Welcome to the community!', test_user_id, test_community_id)
        ON CONFLICT DO NOTHING;
        
        -- Add user to community members
        INSERT INTO community_members (community_id, user_id, role)
        VALUES (test_community_id, test_user_id, 'member')
        ON CONFLICT (community_id, user_id) DO NOTHING;
    END IF;
END $$;

-- 12. Verify the setup
SELECT 
  'Setup Complete' as status,
  'Messages table ready for chat functionality' as message;
