-- Debug script to check Khadija Hashi's created_at date
-- Run this in Supabase SQL Editor to see what's causing the "Invalid Date" issue

-- Check if the user exists and what their created_at looks like
SELECT 
  id,
  first_name,
  last_name,
  email,
  created_at,
  CASE 
    WHEN created_at IS NULL THEN 'NULL'
    WHEN created_at::text = '' THEN 'EMPTY STRING'
    ELSE 'HAS VALUE: ' || created_at::text
  END as created_at_status,
  -- Test if it's a valid date
  CASE 
    WHEN created_at IS NULL THEN 'NULL - INVALID'
    WHEN created_at::text = '' THEN 'EMPTY - INVALID'
    WHEN created_at::timestamp IS NULL THEN 'NOT A TIMESTAMP - INVALID'
    ELSE 'VALID TIMESTAMP'
  END as date_validity
FROM user_profiles 
WHERE email = 'khadija@rhood.io'
   OR (first_name ILIKE '%khadija%' AND last_name ILIKE '%hashi%')
   OR dj_name ILIKE '%khadija%';

-- Also check all user profiles to see if there's a pattern
SELECT 
  COUNT(*) as total_users,
  COUNT(created_at) as users_with_created_at,
  COUNT(*) - COUNT(created_at) as users_without_created_at,
  MIN(created_at) as earliest_date,
  MAX(created_at) as latest_date
FROM user_profiles;

-- Show sample of created_at values to identify the issue
SELECT 
  first_name,
  last_name,
  email,
  created_at,
  created_at::text as created_at_as_text
FROM user_profiles 
ORDER BY created_at NULLS LAST
LIMIT 10;
