-- Simple fix for messages table - add missing column if needed
-- Run this in Supabase SQL Editor

-- Check if messages table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'messages'
) as messages_table_exists;

-- If table exists, check if community_id column exists
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_name = 'messages' 
   AND column_name = 'community_id'
   AND table_schema = 'public'
) as community_id_column_exists;

-- Add community_id column if it doesn't exist
DO $$
BEGIN
    -- Check if messages table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        
        -- Add community_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'community_id' AND table_schema = 'public') THEN
            ALTER TABLE messages ADD COLUMN community_id UUID REFERENCES communities(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added community_id column to messages table';
        ELSE
            RAISE NOTICE 'community_id column already exists in messages table';
        END IF;
        
        -- Add sender_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'sender_id' AND table_schema = 'public') THEN
            ALTER TABLE messages ADD COLUMN sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added sender_id column to messages table';
        ELSE
            RAISE NOTICE 'sender_id column already exists in messages table';
        END IF;
        
        -- Add content column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'content' AND table_schema = 'public') THEN
            ALTER TABLE messages ADD COLUMN content TEXT NOT NULL DEFAULT '';
            RAISE NOTICE 'Added content column to messages table';
        ELSE
            RAISE NOTICE 'content column already exists in messages table';
        END IF;
        
    ELSE
        RAISE NOTICE 'Messages table does not exist - please run the full setup script';
    END IF;
END $$;

-- Verify the current structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test query to see if it works now
SELECT COUNT(*) as total_messages FROM messages;
