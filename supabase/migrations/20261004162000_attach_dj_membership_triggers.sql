-- Finish 20260910180000_dj_membership_approval.sql on the live database:
-- missing columns, dj_invites, RPCs, and the insert/update triggers.
-- Differences from that file:
--   * admin_set_dj_membership also accepts the service role (Studio's API
--     route checks the caller is an admin, then calls with the service key).
--   * protect_dj_membership_columns only blocks non-admin end-user JWTs, so
--     admins, service-role and SQL updates still apply.
-- Safe to re-run.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS membership_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membership_reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invite_code_used TEXT;

ALTER TABLE public.invite_codes
  ADD COLUMN IF NOT EXISTS invite_type TEXT NOT NULL DEFAULT 'brand';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invite_codes_invite_type_check'
  ) THEN
    ALTER TABLE public.invite_codes
      ADD CONSTRAINT invite_codes_invite_type_check
      CHECK (invite_type IN ('brand', 'dj'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.dj_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  message TEXT,
  invited_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ,
  used_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS dj_invites_email_unique
  ON public.dj_invites (lower(email));
CREATE INDEX IF NOT EXISTS idx_dj_invites_used_at
  ON public.dj_invites (used_at);

ALTER TABLE public.dj_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage dj invites" ON public.dj_invites;
CREATE POLICY "Admins can manage dj invites"
  ON public.dj_invites
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE OR REPLACE FUNCTION public.create_dj_invite_code(
  p_label TEXT DEFAULT NULL,
  p_expires_in_days INTEGER DEFAULT 30
)
RETURNS public.invite_codes
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_days INTEGER;
  v_row public.invite_codes%ROWTYPE;
  v_attempts INTEGER := 0;
  v_label TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can create invite codes';
  END IF;

  v_days := GREATEST(1, LEAST(COALESCE(p_expires_in_days, 30), 365));
  v_label := NULLIF(btrim(COALESCE(p_label, '')), '');

  LOOP
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Failed to generate unique invite code after retries';
    END IF;

    SELECT string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (1 + floor(random() * 32))::int, 1), '')
    INTO v_code
    FROM generate_series(1, 8);

    BEGIN
      INSERT INTO public.invite_codes (code, brand_name, invite_type, created_by, expires_at, is_active)
      VALUES (v_code, v_label, 'dj', auth.uid(), now() + make_interval(days => v_days), true)
      RETURNING * INTO v_row;
      RETURN v_row;
    EXCEPTION
      WHEN unique_violation THEN
        NULL;
    END;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_dj_invite_code(TEXT, INTEGER) TO authenticated;

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
  IF p_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Status must be pending, approved, or rejected';
  END IF;

  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'Not authenticated';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Only admins can review DJ applications';
    END IF;
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

CREATE OR REPLACE FUNCTION public.redeem_dj_invite_code(p_code TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code public.invite_codes%ROWTYPE;
  v_normalized TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_normalized := upper(btrim(COALESCE(p_code, '')));
  IF v_normalized = '' THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Invite code is required.');
  END IF;

  SELECT * INTO v_code
  FROM public.invite_codes
  WHERE upper(code) = v_normalized
    AND invite_type = 'dj'
    AND COALESCE(is_active, false) = true
    AND used_by IS NULL
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'This invite code is invalid, used, or expired.');
  END IF;

  PERFORM set_config('rhood.allow_membership_update', 'true', true);

  UPDATE public.user_profiles
  SET
    membership_status = 'approved',
    membership_source = 'invite_code',
    membership_reviewed_at = now(),
    membership_reviewed_by = NULL,
    invite_code_used = v_code.code
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'message', 'Create your DJ profile first, then redeem the code.');
  END IF;

  UPDATE public.invite_codes
  SET used_by = auth.uid(), used_at = now()
  WHERE id = v_code.id;

  RETURN jsonb_build_object('ok', true, 'status', 'approved');
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_dj_invite_code(TEXT) TO authenticated;

DROP TRIGGER IF EXISTS resolve_dj_membership_before_insert ON public.user_profiles;
CREATE TRIGGER resolve_dj_membership_before_insert
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.resolve_dj_membership_before_insert();

CREATE OR REPLACE FUNCTION public.consume_dj_membership_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.membership_source = 'invite' AND NEW.email IS NOT NULL THEN
    UPDATE public.dj_invites
    SET used_at = now(), used_by = NEW.id
    WHERE lower(email) = lower(btrim(NEW.email))
      AND used_at IS NULL;
  END IF;

  IF NEW.membership_source = 'invite_code' AND COALESCE(NEW.invite_code_used, '') <> '' THEN
    UPDATE public.invite_codes
    SET used_by = NEW.id, used_at = now()
    WHERE upper(code) = upper(btrim(NEW.invite_code_used))
      AND invite_type = 'dj'
      AND used_by IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS consume_dj_membership_after_insert ON public.user_profiles;
CREATE TRIGGER consume_dj_membership_after_insert
  AFTER INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.consume_dj_membership_after_insert();

CREATE OR REPLACE FUNCTION public.protect_dj_membership_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('rhood.allow_membership_update', true) = 'true'
     OR auth.uid() IS NULL
     OR COALESCE(auth.role(), '') = 'service_role'
     OR EXISTS (
       SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin'
     ) THEN
    RETURN NEW;
  END IF;

  NEW.membership_status := OLD.membership_status;
  NEW.membership_source := OLD.membership_source;
  NEW.membership_reviewed_at := OLD.membership_reviewed_at;
  NEW.membership_reviewed_by := OLD.membership_reviewed_by;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_dj_membership_columns ON public.user_profiles;
CREATE TRIGGER protect_dj_membership_columns
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_dj_membership_columns();
