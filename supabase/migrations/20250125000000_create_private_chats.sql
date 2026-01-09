-- Create private chats system for communities
-- This allows members to create private chats within communities
-- Only members of the private chat can see it exists

-- Create private_chats table
CREATE TABLE IF NOT EXISTS private_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create private_chat_members table
CREATE TABLE IF NOT EXISTS private_chat_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  private_chat_id UUID REFERENCES private_chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  added_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(private_chat_id, user_id)
);

-- Add private_chat_id to community_posts table (nullable - null means public community message)
-- Check if community_posts table exists, if not use messages table
DO $$
BEGIN
  -- Try to add to community_posts first (if it exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_posts') THEN
    ALTER TABLE community_posts 
    ADD COLUMN IF NOT EXISTS private_chat_id UUID REFERENCES private_chats(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_community_posts_private_chat_id ON community_posts(private_chat_id);
    
    -- Add constraint: post must be either community or private chat, not both
    ALTER TABLE community_posts
    DROP CONSTRAINT IF EXISTS community_posts_community_or_private_check;
    
    ALTER TABLE community_posts
    ADD CONSTRAINT community_posts_community_or_private_check 
    CHECK (
      (community_id IS NOT NULL AND private_chat_id IS NULL) OR
      (community_id IS NULL AND private_chat_id IS NOT NULL)
    );
  END IF;
  
  -- Also add to messages table if it exists (for backward compatibility)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    ALTER TABLE messages 
    ADD COLUMN IF NOT EXISTS private_chat_id UUID REFERENCES private_chats(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_messages_private_chat_id ON messages(private_chat_id);
    
    ALTER TABLE messages
    DROP CONSTRAINT IF EXISTS messages_community_or_private_check;
    
    ALTER TABLE messages
    ADD CONSTRAINT messages_community_or_private_check 
    CHECK (
      (community_id IS NOT NULL AND private_chat_id IS NULL) OR
      (community_id IS NULL AND private_chat_id IS NOT NULL)
    );
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_private_chats_community_id ON private_chats(community_id);
CREATE INDEX IF NOT EXISTS idx_private_chats_created_by ON private_chats(created_by);
CREATE INDEX IF NOT EXISTS idx_private_chat_members_chat_id ON private_chat_members(private_chat_id);
CREATE INDEX IF NOT EXISTS idx_private_chat_members_user_id ON private_chat_members(user_id);

-- Enable Row Level Security
ALTER TABLE private_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_chat_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for private_chats
-- Users can only see private chats they are members of
CREATE POLICY "Users can view private chats they are members of" ON private_chats
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM private_chat_members 
      WHERE private_chat_members.private_chat_id = private_chats.id 
      AND private_chat_members.user_id = auth.uid()
    )
  );

-- Users can create private chats in communities they belong to
CREATE POLICY "Users can create private chats in their communities" ON private_chats
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_members.community_id = private_chats.community_id 
      AND community_members.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Users can update private chats they created
CREATE POLICY "Users can update private chats they created" ON private_chats
  FOR UPDATE USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Users can delete private chats they created
CREATE POLICY "Users can delete private chats they created" ON private_chats
  FOR DELETE USING (created_by = auth.uid());

-- RLS Policies for private_chat_members
-- Users can view members of private chats they belong to
CREATE POLICY "Users can view members of their private chats" ON private_chat_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM private_chat_members pcm
      WHERE pcm.private_chat_id = private_chat_members.private_chat_id 
      AND pcm.user_id = auth.uid()
    )
  );

-- Users can add members to private chats they created or belong to
CREATE POLICY "Users can add members to private chats" ON private_chat_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM private_chat_members pcm
      WHERE pcm.private_chat_id = private_chat_members.private_chat_id 
      AND pcm.user_id = auth.uid()
    )
    AND added_by = auth.uid()
  );

-- Users can remove themselves from private chats
-- Chat creators can remove any member
CREATE POLICY "Users can remove members from private chats" ON private_chat_members
  FOR DELETE USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM private_chats pc
      WHERE pc.id = private_chat_members.private_chat_id
      AND pc.created_by = auth.uid()
    )
  );

-- Update community_posts RLS policies to support private chats (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_posts') THEN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view posts in communities they belong to" ON community_posts;
    DROP POLICY IF EXISTS "Users can send posts to communities they belong to" ON community_posts;
    DROP POLICY IF EXISTS "Users can view messages in their communities and private chats" ON community_posts;
    DROP POLICY IF EXISTS "Users can send messages to their communities and private chats" ON community_posts;
    
    -- Users can view posts in communities they belong to OR private chats they are members of
    EXECUTE 'CREATE POLICY "Users can view posts in their communities and private chats" ON community_posts
      FOR SELECT USING (
        -- Public community posts
        (community_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM community_members 
          WHERE community_members.community_id = community_posts.community_id 
          AND community_members.user_id = auth.uid()
        ))
        OR
        -- Private chat posts
        (private_chat_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM private_chat_members 
          WHERE private_chat_members.private_chat_id = community_posts.private_chat_id 
          AND private_chat_members.user_id = auth.uid()
        ))
      )';
    
    -- Users can send posts to communities they belong to OR private chats they are members of
    EXECUTE 'CREATE POLICY "Users can send posts to their communities and private chats" ON community_posts
      FOR INSERT WITH CHECK (
        -- Public community posts
        (community_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM community_members 
          WHERE community_members.community_id = community_posts.community_id 
          AND community_members.user_id = auth.uid()
        )
        AND author_id = auth.uid())
        OR
        -- Private chat posts
        (private_chat_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM private_chat_members 
          WHERE private_chat_members.private_chat_id = community_posts.private_chat_id 
          AND private_chat_members.user_id = auth.uid()
        )
        AND author_id = auth.uid())
      )';
  END IF;
  
  -- Also update messages table policies if it exists (for backward compatibility)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    DROP POLICY IF EXISTS "Users can view messages in communities they belong to" ON messages;
    DROP POLICY IF EXISTS "Users can send messages to communities they belong to" ON messages;
    
    EXECUTE 'CREATE POLICY "Users can view messages in their communities and private chats" ON messages
      FOR SELECT USING (
        (community_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM community_members 
          WHERE community_members.community_id = messages.community_id 
          AND community_members.user_id = auth.uid()
        ))
        OR
        (private_chat_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM private_chat_members 
          WHERE private_chat_members.private_chat_id = messages.private_chat_id 
          AND private_chat_members.user_id = auth.uid()
        ))
      )';
    
    EXECUTE 'CREATE POLICY "Users can send messages to their communities and private chats" ON messages
      FOR INSERT WITH CHECK (
        (community_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM community_members 
          WHERE community_members.community_id = messages.community_id 
          AND community_members.user_id = auth.uid()
        )
        AND sender_id = auth.uid())
        OR
        (private_chat_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM private_chat_members 
          WHERE private_chat_members.private_chat_id = messages.private_chat_id 
          AND private_chat_members.user_id = auth.uid()
        )
        AND sender_id = auth.uid())
      )';
  END IF;
END $$;

-- Create updated_at trigger for private_chats
CREATE OR REPLACE FUNCTION update_private_chats_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_private_chats_updated_at 
  BEFORE UPDATE ON private_chats 
  FOR EACH ROW 
  EXECUTE FUNCTION update_private_chats_updated_at_column();

-- Verify the setup
SELECT 'Private chats system created successfully' as status;
