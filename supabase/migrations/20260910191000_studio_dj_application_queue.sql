-- Studio has membership_status / membership_source but is missing the
-- review columns and admin_set_dj_membership RPC that the queue writes.
-- Safe to re-run.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS membership_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membership_reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invite_code_used TEXT;

NOTIFY pgrst, 'reload schema';

CREATE OR REPLACE FUNCTION public.admin_set_dj_membership(
  p_user_id UUID,
  p_status TEXT,
  p_source TEXT DEFAULT NULL
)
RETURNS public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.user_profiles%ROWTYPE;
  v_source TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Status must be pending, approved, or rejected';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can review DJ applications';
  END IF;

  v_source := NULLIF(btrim(COALESCE(p_source, '')), '');
  IF v_source IS NOT NULL AND v_source NOT IN (
    'invite', 'invite_code', 'application', 'existing', 'staff'
  ) THEN
    RAISE EXCEPTION 'Invalid membership source';
  END IF;

  PERFORM set_config('rhood.allow_membership_update', 'true', true);

  UPDATE public.user_profiles
  SET
    membership_status = p_status,
    membership_source = CASE
      WHEN v_source IS NOT NULL THEN v_source
      WHEN p_status = 'pending' THEN 'application'
      ELSE COALESCE(membership_source, 'application')
    END,
    membership_reviewed_at = now(),
    membership_reviewed_by = auth.uid()
  WHERE id = p_user_id
    AND (role IS NULL OR role = 'dj')
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'DJ profile not found';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_dj_membership(UUID, TEXT, TEXT) TO authenticated;
