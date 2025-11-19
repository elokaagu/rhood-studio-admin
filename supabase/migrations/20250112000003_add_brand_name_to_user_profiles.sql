-- Add brand_name column to user_profiles table
-- This is separate from dj_name - used specifically for brand accounts
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS brand_name TEXT;

-- Create index for brand name lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_brand_name ON user_profiles(brand_name);

