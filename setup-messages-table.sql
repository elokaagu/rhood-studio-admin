-- Create messages table for community chat
-- Run this in Supabase SQL Editor

-- Create messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_community_id ON messages(community_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view messages in communities they belong to" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_members.community_id = messages.community_id 
      AND community_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to communities they belong to" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_members.community_id = messages.community_id 
      AND community_members.user_id = auth.uid()
    )
    AND sender_id = auth.uid()
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (sender_id = auth.uid());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_messages_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_messages_updated_at_column();

-- Insert some test messages for FUTURE BEATS community (if it exists)
DO $$
DECLARE
    future_beats_id UUID;
    test_user_id UUID;
BEGIN
    -- Find FUTURE BEATS community
    SELECT id INTO future_beats_id 
    FROM communities 
    WHERE name ILIKE '%future%beats%' 
    LIMIT 1;
    
    -- Find a test user (first user in user_profiles)
    SELECT id INTO test_user_id 
    FROM user_profiles 
    LIMIT 1;
    
    -- Insert test messages if community exists and we have a user
    IF future_beats_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        -- Check if messages already exist
        IF NOT EXISTS (SELECT 1 FROM messages WHERE community_id = future_beats_id) THEN
            INSERT INTO messages (content, sender_id, community_id) VALUES
            ('Welcome to FUTURE BEATS! 🎵', test_user_id, future_beats_id),
            ('Excited to share some amazing tracks with you all!', test_user_id, future_beats_id),
            ('What''s everyone listening to today?', test_user_id, future_beats_id);
            
            RAISE NOTICE 'Inserted test messages for FUTURE BEATS community';
        ELSE
            RAISE NOTICE 'Messages already exist for FUTURE BEATS community';
        END IF;
    ELSE
        RAISE NOTICE 'Could not find FUTURE BEATS community or test user';
    END IF;
END $$;

-- Verify the setup
SELECT 'Messages table created successfully' as status;
SELECT COUNT(*) as total_messages FROM messages;
