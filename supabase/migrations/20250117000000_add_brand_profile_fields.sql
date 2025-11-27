-- Add brand profile fields to user_profiles table
-- This allows brands to store their description and website URL

-- Add brand_description column
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS brand_description TEXT;

-- Add website column for brand website URL
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS website TEXT;

-- Add index for website lookups (if needed in the future)
CREATE INDEX IF NOT EXISTS idx_user_profiles_website ON user_profiles(website) WHERE website IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.brand_description IS 'Brand description/bio for brand accounts';
COMMENT ON COLUMN user_profiles.website IS 'Brand website URL';

