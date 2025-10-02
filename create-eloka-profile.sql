-- Create user profile for eloka@rhood.io
-- Run this SQL in your Supabase SQL Editor

-- First, let's check if the user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'eloka@rhood.io';

-- If the user doesn't exist, you'll need to create them through Supabase Auth first
-- Go to Authentication > Users in your Supabase dashboard and create the user manually
-- Or use the Supabase Auth API to sign up the user

-- Once you have the user ID, replace 'YOUR_USER_ID_HERE' with the actual ID
-- You can get the ID from the SELECT query above

-- Create the user profile
INSERT INTO user_profiles (
  id,
  first_name,
  last_name,
  dj_name,
  email,
  city,
  bio,
  genres,
  instagram,
  soundcloud,
  profile_image_url
) VALUES (
  '64ee29a2-dfd1-4c0a-824a-81b15398ff32',
  'Eloka',
  'Agu',
  'Eloka Agu',
  'eloka@rhood.io',
  'Studio',
  'Rhood Studio Super Administrator - Managing all studio operations, opportunities, and community features.',
  ARRAY['Admin', 'Studio Management', 'Super Admin'],
  'https://instagram.com/elokaagu',
  'https://soundcloud.com/elokaagu',
  NULL -- No profile image initially
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  dj_name = EXCLUDED.dj_name,
  email = EXCLUDED.email,
  city = EXCLUDED.city,
  bio = EXCLUDED.bio,
  genres = EXCLUDED.genres,
  instagram = EXCLUDED.instagram,
  soundcloud = EXCLUDED.soundcloud,
  updated_at = NOW();

-- Verify the profile was created
SELECT * FROM user_profiles WHERE email = 'eloka@rhood.io';

-- Alternative: If you want to create a test profile with a random UUID
-- (Use this only if you can't get the actual auth user ID)
/*
INSERT INTO user_profiles (
  id,
  first_name,
  last_name,
  dj_name,
  email,
  city,
  bio,
  genres,
  instagram,
  soundcloud,
  profile_image_url
) VALUES (
  gen_random_uuid(),
  'Eloka',
  'Agu',
  'Eloka Agu',
  'eloka@rhood.io',
  'Studio',
  'Rhood Studio Super Administrator - Managing all studio operations, opportunities, and community features.',
  ARRAY['Admin', 'Studio Management', 'Super Admin'],
  'https://instagram.com/elokaagu',
  'https://soundcloud.com/elokaagu',
  NULL
) ON CONFLICT (email) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  dj_name = EXCLUDED.dj_name,
  city = EXCLUDED.city,
  bio = EXCLUDED.bio,
  genres = EXCLUDED.genres,
  instagram = EXCLUDED.instagram,
  soundcloud = EXCLUDED.soundcloud,
  updated_at = NOW();
*/
