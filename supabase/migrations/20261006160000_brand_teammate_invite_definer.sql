-- Brand users can't insert into invite_codes directly (admin-only policy).
-- The function checks the caller is an admin or on this brand account itself.
ALTER FUNCTION public.create_brand_teammate_invite_code(uuid, integer) SECURITY DEFINER;
