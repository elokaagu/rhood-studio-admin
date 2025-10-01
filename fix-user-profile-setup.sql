-- Fix User Profile Setup (Run this in Supabase SQL Editor)
-- This script will help you create a user profile manually

-- Step 1: Check current authentication status
SELECT 
  'Current auth status:' as info,
  auth.uid() as user_id,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ Not authenticated in SQL Editor'
    ELSE '✅ Authenticated'
  END as auth_status;

-- Step 2: If not authenticated, you need to get your user ID from the app
-- Go to your web app, open browser console, and run: 
-- supabase.auth.getUser().then(user => console.log('User ID:', user.data.user?.id))

-- Step 3: Once you have your user ID, replace 'YOUR_USER_ID_HERE' below and run this:
/*
INSERT INTO user_profiles (
  id,
  first_name,
  last_name,
  dj_name,
  email,
  city,
  bio,
  genres
) VALUES (
  'YOUR_USER_ID_HERE',  -- Replace this with your actual user ID from step 2
  'Studio',
  'Admin',
  'Rhood Admin',
  'admin@rhood.studio',
  'Studio',
  'Rhood Studio Administrator',
  ARRAY['Admin', 'Studio', 'Management']
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  dj_name = EXCLUDED.dj_name,
  email = EXCLUDED.email,
  city = EXCLUDED.city,
  bio = EXCLUDED.bio,
  genres = EXCLUDED.genres;
*/

-- Step 4: Alternative - Create a test user profile with a known ID
-- Uncomment and run this if you want to create a test profile:
/*
INSERT INTO user_profiles (
  id,
  first_name,
  last_name,
  dj_name,
  email,
  city,
  bio,
  genres
) VALUES (
  gen_random_uuid(),  -- This creates a random UUID
  'Test',
  'User',
  'Test DJ',
  'test@rhood.studio',
  'Test City',
  'Test user for community creation',
  ARRAY['Test', 'Demo']
);
*/

-- Step 5: Check existing profiles
SELECT 
  'Existing profiles:' as info,
  id,
  first_name,
  last_name,
  dj_name,
  email,
  created_at
FROM user_profiles 
ORDER BY created_at DESC 
LIMIT 5;
