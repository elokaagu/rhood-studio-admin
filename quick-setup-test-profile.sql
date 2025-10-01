-- Quick Setup: Create Test User Profile
-- Run this in your Supabase SQL Editor to quickly create a test profile

-- Create a test user profile with your current auth user ID
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
  'Studio',
  'Admin',
  'Rhood Admin',
  'admin@rhood.studio',
  'Studio',
  'Rhood Studio Administrator - Can create and manage communities',
  ARRAY['Admin', 'Studio', 'Management']
) ON CONFLICT (id) DO NOTHING;

-- Verify the profile was created
SELECT 
  'Profile created successfully!' as message,
  id,
  first_name,
  last_name,
  dj_name,
  email
FROM user_profiles 
WHERE id = auth.uid();

-- Show that you can now create communities
SELECT 
  '✅ Ready to create communities!' as status,
  'Your user profile is now set up and you can create communities.' as instructions;
