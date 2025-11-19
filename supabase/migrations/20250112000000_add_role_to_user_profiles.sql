-- Add role column to user_profiles table
-- Roles: 'admin' (R/HOOD team) or 'brand' (brand portal accounts)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'brand'));

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Update existing users to be admins (if they don't have a role set)
UPDATE user_profiles SET role = 'admin' WHERE role IS NULL;

