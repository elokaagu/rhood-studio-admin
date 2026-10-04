-- New profiles (DJ app sign-ups) must not inherit admin rights.
-- Only eloka@ and johan@ stay admin.

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role IS NULL OR role IN ('admin', 'brand', 'dj'));

ALTER TABLE public.user_profiles ALTER COLUMN role SET DEFAULT 'dj';

UPDATE public.user_profiles
SET role = 'dj'
WHERE role = 'admin'
  AND lower(btrim(email)) NOT IN ('eloka@rhood.io', 'johan@rhood.io');
