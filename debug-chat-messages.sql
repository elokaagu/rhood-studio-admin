-- Debug chat messages for FUTURE BEATS community
-- Run this in Supabase SQL Editor

-- First, let's find the FUTURE BEATS community ID
SELECT id, name, description 
FROM communities 
WHERE name ILIKE '%future%beats%' OR name ILIKE '%future beats%'
ORDER BY created_at DESC;

-- Check if messages table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- Check for any messages in the messages table
SELECT COUNT(*) as total_messages FROM messages;

-- Check for messages related to FUTURE BEATS community (replace with actual community ID)
-- First get the community ID, then use it below
WITH future_beats_community AS (
  SELECT id FROM communities WHERE name ILIKE '%future%beats%' LIMIT 1
)
SELECT 
  m.id,
  m.content,
  m.sender_id,
  m.community_id,
  m.created_at,
  up.first_name,
  up.last_name
FROM messages m
LEFT JOIN user_profiles up ON m.sender_id = up.id
CROSS JOIN future_beats_community fbc
WHERE m.community_id = fbc.id
ORDER BY m.created_at DESC;

-- Check if there are any foreign key constraints on messages table
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='messages';

-- Check RLS policies on messages table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'messages';

-- Check if user_profiles table has the expected columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('id', 'first_name', 'last_name', 'profile_image_url')
ORDER BY ordinal_position;
