-- Set team@houseofagu.com as a brand account for Nike
-- This updates the user's role to 'brand' and sets the brand name to "Nike"
-- The first_name and last_name are for the point of contact

UPDATE user_profiles 
SET 
  role = 'brand',
  brand_name = 'Nike',
  dj_name = '', -- Clear DJ name for brand accounts
  first_name = 'Eloka', -- Point of contact first name
  last_name = 'Agu' -- Point of contact last name
WHERE email = 'team@houseofagu.com';

-- If the user profile doesn't exist yet, you'll need to create it first
-- This assumes the user has already signed up via Supabase Auth
-- If not, you may need to:
-- 1. Create the auth user first in Supabase Dashboard
-- 2. Then run this migration

