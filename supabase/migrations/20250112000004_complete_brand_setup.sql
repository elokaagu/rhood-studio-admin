-- Complete brand setup migration
-- Run this to set up brand accounts from scratch
-- This includes: role column, brand_name column, and Nike account setup

-- Step 1: Add role column (if not exists)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'brand'));

-- Create index for role lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Update existing users to be admins (if they don't have a role set)
UPDATE user_profiles SET role = 'admin' WHERE role IS NULL;

-- Step 2: Add brand_name column (if not exists)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS brand_name TEXT;

-- Create index for brand name lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_profiles_brand_name ON user_profiles(brand_name);

-- Step 3: Set up Nike brand account
-- Note: This will only update if the user exists. If the user doesn't exist yet,
-- you'll need to create the auth user first in Supabase Dashboard, then run this.
UPDATE user_profiles 
SET 
  role = 'brand',
  brand_name = 'Nike',
  dj_name = '', -- Clear DJ name for brand accounts
  first_name = 'Eloka', -- Point of contact first name
  last_name = 'Agu' -- Point of contact last name
WHERE email = 'team@houseofagu.com';

