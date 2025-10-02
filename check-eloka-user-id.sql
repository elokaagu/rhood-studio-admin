-- Check if eloka@rhood.io exists in auth.users
-- Run this in your Supabase SQL Editor

-- First, check if the user exists in auth.users
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'eloka@rhood.io';

-- If no results, the user doesn't exist yet
-- You'll need to create them in Supabase Dashboard first

-- Alternative: Check all users to see what's available
SELECT 
  id,
  email,
  created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;
