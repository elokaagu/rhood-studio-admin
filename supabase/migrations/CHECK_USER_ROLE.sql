-- Quick check to verify your user role
-- Run this first to make sure you're actually an admin

-- Check current user's role
SELECT 
  id,
  email,
  role,
  dj_name,
  brand_name,
  first_name,
  last_name
FROM user_profiles
WHERE id = auth.uid();

-- If role is NULL or not 'admin', update it:
-- UPDATE user_profiles SET role = 'admin' WHERE id = auth.uid();

-- Check all admin users
SELECT 
  id,
  email,
  role
FROM user_profiles
WHERE role = 'admin';
