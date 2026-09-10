-- Invite-only DJ membership.
-- Existing DJs stay approved. New app signups default to pending unless they
-- were emailed an invite or redeemed a DJ invite code.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.user_profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.user_profiles DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE role IS NOT NULL AND role NOT IN ('admin', 'brand', 'dj')
  ) THEN
    ALTER TABLE public.user_profiles
      ADD CONSTRAINT user_profiles_role_check
      CHECK (role IS NULL OR role IN ('admin', 'brand', 'dj'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS membership_status TEXT,
  ADD COLUMN IF NOT EXISTS membership_source TEXT,
  ADD COLUMN IF NOT EXISTS membership_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membership_reviewed_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invite_code_used TEXT;

-- This database may already have membership_source values from another
-- feature. Map unknowns so the invite-only check can be added.
UPDATE public.user_profiles
SET membership_status = CASE
  WHEN membership_status IN ('pending', 'approved', 'rejected') THEN membership_status
  ELSE 'approved'
END;

UPDATE public.user_profiles
SET membership_source = CASE
  WHEN membership_source IN (
    'invite',
    'invite_code',
    'application',
    'existing',
    'staff'
  ) THEN membership_source
  WHEN role IN ('admin', 'brand') THEN 'staff'
  ELSE 'existing'
END;

ALTER TABLE public.user_profiles
  ALTER COLUMN membership_status SET DEFAULT 'pending';

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_membership_status_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_membership_status_check
  CHECK (membership_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_membership_source_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_membership_source_check
  CHECK (
    membership_source IS NULL OR membership_source IN (
      'invite',
      'invite_code',
      'application',
      'existing',
      'staff'
    )
  );

CREATE INDEX IF NOT EXISTS idx_user_profiles_membership_status
  ON public.user_profiles (membership_status);

COMMENT ON COLUMN public.user_profiles.membership_status IS
  'Invite-only DJ access: pending (app apply), approved, or rejected.';
COMMENT ON COLUMN public.user_profiles.membership_source IS
  'How membership was decided: invite, invite_code, application, existing, or staff.';

-- DJ email invites (auto-approve when a matching profile is created)
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
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Invite codes can be brand or DJ. Create the table when this database
-- never received the Studio brand-invite migrations (e.g. the DJ app DB).
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  brand_name TEXT,
  invite_type TEXT NOT NULL DEFAULT 'brand',
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  used_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.invite_codes
  ALTER COLUMN brand_name DROP NOT NULL;

ALTER TABLE public.invite_codes
  ADD COLUMN IF NOT EXISTS invite_type TEXT NOT NULL DEFAULT 'brand';

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all invite codes" ON public.invite_codes;
CREATE POLICY "Admins can view all invite codes"
  ON public.invite_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can create invite codes" ON public.invite_codes;
CREATE POLICY "Admins can create invite codes"
  ON public.invite_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Admins can update invite codes" ON public.invite_codes;
CREATE POLICY "Admins can update invite codes"
  ON public.invite_codes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Anyone can check invite code validity" ON public.invite_codes;
CREATE POLICY "Anyone can check invite code validity"
  ON public.invite_codes
  FOR SELECT
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND used_by IS NULL
  );

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by ON public.invite_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_invite_codes_used_by ON public.invite_codes(used_by);
CREATE INDEX IF NOT EXISTS idx_invite_codes_is_active ON public.invite_codes(is_active);

UPDATE public.invite_codes
SET invite_type = 'brand'
WHERE invite_type IS NULL OR invite_type = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'invite_codes_invite_type_check'
  ) THEN
    ALTER TABLE public.invite_codes
      ADD CONSTRAINT invite_codes_invite_type_check
      CHECK (invite_type IN ('brand', 'dj'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_invite_codes_invite_type
  ON public.invite_codes (invite_type);

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
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
      AND role = 'admin'
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
      INSERT INTO public.invite_codes (
        code,
        brand_name,
        invite_type,
        created_by,
        expires_at,
        is_active
      )
      VALUES (
        v_code,
        v_label,
        'dj',
        auth.uid(),
        now() + make_interval(days => v_days),
        true
      )
      RETURNING *
      INTO v_row;

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

CREATE OR REPLACE FUNCTION public.resolve_dj_membership_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_code TEXT;
  v_invite_id UUID;
  v_code_id UUID;
BEGIN
  IF NEW.role IN ('admin', 'brand') THEN
    NEW.membership_status := 'approved';
    NEW.membership_source := COALESCE(NEW.membership_source, 'staff');
    RETURN NEW;
  END IF;

  v_email := lower(btrim(COALESCE(NEW.email, '')));
  v_code := upper(btrim(COALESCE(NEW.invite_code_used, '')));

  IF v_email <> '' THEN
    SELECT id INTO v_invite_id
    FROM public.dj_invites
    WHERE lower(email) = v_email
      AND used_at IS NULL
    LIMIT 1;

    IF v_invite_id IS NOT NULL THEN
      NEW.membership_status := 'approved';
      NEW.membership_source := 'invite';
      NEW.membership_reviewed_at := now();
      RETURN NEW;
    END IF;
  END IF;

  IF v_code <> '' THEN
    SELECT id INTO v_code_id
    FROM public.invite_codes
    WHERE upper(code) = v_code
      AND invite_type = 'dj'
      AND COALESCE(is_active, false) = true
      AND used_by IS NULL
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;

    IF v_code_id IS NOT NULL THEN
      NEW.membership_status := 'approved';
      NEW.membership_source := 'invite_code';
      NEW.membership_reviewed_at := now();
      RETURN NEW;
    END IF;
  END IF;

  NEW.membership_status := 'pending';
  NEW.membership_source := 'application';
  RETURN NEW;
END;
$$;

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
  IF current_setting('rhood.allow_membership_update', true) = 'true' THEN
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
