-- Debug Member Deletion Issues
-- Run this in your Supabase SQL Editor

-- 1. Check user_profiles table structure
SELECT 
  'Table Schema Check' as check_type,
  column_name || ' (' || data_type || ', nullable: ' || is_nullable || ')' as result
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 2. Check if there are any foreign key constraints
SELECT 
  'Foreign Key Constraints' as check_type,
  tc.constraint_name || ' -> ' || ccu.table_name || '.' || ccu.column_name as result
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'user_profiles' 
AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Check RLS policies on user_profiles
SELECT 
  'RLS Policies' as check_type,
  policyname || ' (' || cmd || ')' as result
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 4. Show sample user_profiles data
SELECT 
  'User Profiles Count' as check_type,
  COUNT(*)::text || ' total profiles' as result
FROM user_profiles;

-- 5. Show first few user profiles
SELECT 
  'Profile: ' || COALESCE(first_name || ' ' || last_name, email, 'Unknown') as check_type,
  'ID: ' || id || ', Email: ' || COALESCE(email, 'No email') as result
FROM user_profiles 
LIMIT 5;
