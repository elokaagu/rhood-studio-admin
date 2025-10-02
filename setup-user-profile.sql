-- Setup User Profile for Community Creation
-- Run this in your Supabase SQL Editor

-- Step 1: Get your current user ID
SELECT auth.uid() as user_id;
\\|

-- Step 2: Check if you already have a profile
SELECT * FROM user_profiles WHERE id = auth.uid();

-- Step 3: Create your user profile (only if you don't have one)
-- Replace the values below with your actual information
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
  auth.uid(),
  'Admin',  -- Replace with your first name
  'User',   -- Replace with your last name
  'Admin DJ', -- Replace with your DJ name
  'admin@rhood.com', -- Replace with your email
  'Your City', -- Replace with your city
  'Rhood Studio Administrator', -- Replace with your bio
  ARRAY['House', 'Techno', 'Electronic'] -- Replace with your genres
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  dj_name = EXCLUDED.dj_name,
  email = EXCLUDED.email,
  city = EXCLUDED.city,
  bio = EXCLUDED.bio,
  genres = EXCLUDED.genres;

-- Step 4: Verify your profile was created
SELECT 
  id,
  first_name,
  last_name,
  dj_name,
  email,
  city,
  bio,
  genres,
  created_at
FROM user_profiles 
WHERE id = auth.uid();

-- Step 5: Test community creation permission
-- This will show if you can now create communities
SELECT 
  'Profile ready for community creation!' as status,
  CASE 
    WHEN EXISTS(SELECT 1 FROM user_profiles WHERE id = auth.uid()) 
    THEN '✅ User profile exists' 
    ELSE '❌ User profile missing' 
  END as profile_check;
