-- Fix messages table - handle existing table with wrong structure
-- Run this in Supabase SQL Editor

-- First, let's check what exists
SELECT 'Checking current table structure...' as status;

-- Check if messages table exists and its structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Drop the messages table if it exists (this will remove any existing data)
DROP TABLE IF EXISTS messages CASCADE;

-- Create the messages table with correct structure
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_messages_community_id ON messages(community_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages in communities they belong to" ON messages;
DROP POLICY IF EXISTS "Users can send messages to communities they belong to" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

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

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON messages 
  FOR EACH ROW 
  EXECUTE FUNCTION update_messages_updated_at_column();

-- Insert some test messages for FUTURE BEATS community
DO $$
DECLARE
    future_beats_id UUID;
    test_user_id UUID;
BEGIN
    -- Find FUTURE BEATS community
    SELECT id INTO future_beats_id 
    FROM communities 
    WHERE name ILIKE '%future%beats%' OR name ILIKE '%FUTURE%BEATS%'
    LIMIT 1;
    
    -- Find a test user (first user in user_profiles)
    SELECT id INTO test_user_id 
    FROM user_profiles 
    LIMIT 1;
    
    -- Insert test messages if community exists and we have a user
    IF future_beats_id IS NOT NULL AND test_user_id IS NOT NULL THEN
        INSERT INTO messages (content, sender_id, community_id) VALUES
        ('Welcome to FUTURE BEATS! 🎵', test_user_id, future_beats_id),
        ('Excited to share some amazing tracks with you all!', test_user_id, future_beats_id),
        ('What''s everyone listening to today?', test_user_id, future_beats_id);
        
        RAISE NOTICE 'Inserted test messages for FUTURE BEATS community (ID: %)', future_beats_id;
    ELSE
        RAISE NOTICE 'Could not find FUTURE BEATS community or test user';
        RAISE NOTICE 'Future beats ID: %, Test user ID: %', future_beats_id, test_user_id;
    END IF;
END $$;

-- Verify the setup
SELECT 'Messages table created successfully' as status;
SELECT COUNT(*) as total_messages FROM messages;

-- Show the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;
