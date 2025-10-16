-- Comprehensive chat debugging script
-- Run this in your Supabase SQL Editor

-- 1. Check if messages table exists
SELECT 
  'Table Existence Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') 
    THEN 'messages table exists' 
    ELSE 'messages table does NOT exist' 
  END as result;

-- 2. Check messages table structure
SELECT 
  'Table Structure Check' as check_type,
  column_name || ' (' || data_type || ', nullable: ' || is_nullable || ')' as result
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages'
ORDER BY ordinal_position;

-- 3. Check if communities table exists and has data
SELECT 
  'Communities Check' as check_type,
  COUNT(*)::text || ' communities found' as result
FROM communities;

-- 4. Show all communities with their IDs
SELECT 
  'Community: ' || name as check_type,
  'ID: ' || id || ', Created: ' || COALESCE(created_at::text, 'NULL') as result
FROM communities 
ORDER BY created_at DESC;

-- 5. Check if user_profiles table exists and has data
SELECT 
  'User Profiles Check' as check_type,
  COUNT(*)::text || ' user profiles found' as result
FROM user_profiles;

-- 6. Check RLS policies on messages table
SELECT 
  'RLS Policy Check' as check_type,
  policyname || ' (' || cmd || ')' as result
FROM pg_policies 
WHERE tablename = 'messages';

-- 7. Check if there are any messages at all
SELECT 
  'Total Messages Check' as check_type,
  COUNT(*)::text || ' total messages in database' as result
FROM messages;

-- 8. Show sample messages if any exist
SELECT 
  'Sample Message: ' || COALESCE(LEFT(content, 50), 'NULL') as check_type,
  'ID: ' || id || ', Community: ' || community_id || ', Sender: ' || COALESCE(sender_id::text, 'NULL') as result
FROM messages 
LIMIT 5;

-- 9. Check foreign key constraints
SELECT 
  'Foreign Key Check' as check_type,
  tc.constraint_name || ' -> ' || ccu.table_name || '.' || ccu.column_name as result
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'messages' 
AND tc.constraint_type = 'FOREIGN KEY';

-- 10. Check if community_members table exists (needed for RLS)
SELECT 
  'Community Members Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'community_members') 
    THEN 'community_members table exists' 
    ELSE 'community_members table does NOT exist' 
  END as result;

-- 11. Check community_members data if table exists
SELECT 
  'Community Members Data' as check_type,
  COUNT(*)::text || ' community members found' as result
FROM community_members;
