-- Shared brand accounts: extra people log in as themselves but see the
-- same listings, applications, and bookings as the original brand.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS brand_account_id UUID REFERENCES public.user_profiles(id);

ALTER TABLE public.invite_codes
  ADD COLUMN IF NOT EXISTS brand_account_id UUID REFERENCES public.user_profiles(id);

CREATE INDEX IF NOT EXISTS user_profiles_brand_account_idx
  ON public.user_profiles (brand_account_id)
  WHERE brand_account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS invite_codes_brand_account_idx
  ON public.invite_codes (brand_account_id)
  WHERE brand_account_id IS NOT NULL;

COMMENT ON COLUMN public.user_profiles.brand_account_id IS
  'Owner user_profiles.id for a shared brand. Null means this user is the account.';

CREATE OR REPLACE FUNCTION public.current_brand_account_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(brand_account_id, id)
  FROM public.user_profiles
  WHERE id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.current_brand_account_id() TO authenticated;

CREATE OR REPLACE FUNCTION public.create_brand_teammate_invite_code(
  p_brand_account_id UUID,
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
  v_brand_name TEXT;
  v_owner UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(brand_account_id, id), COALESCE(brand_name, TRIM(first_name || ' ' || last_name), 'Brand')
    INTO v_owner, v_brand_name
  FROM public.user_profiles
  WHERE id = p_brand_account_id
    AND role = 'brand';

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Brand account not found';
  END IF;

  IF NOT (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
    OR public.current_brand_account_id() = v_owner
  ) THEN
    RAISE EXCEPTION 'Not allowed to invite teammates for this brand';
  END IF;

  v_days := GREATEST(1, LEAST(COALESCE(p_expires_in_days, 30), 365));

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
        created_by,
        expires_at,
        is_active,
        invite_type,
        brand_account_id
      )
      VALUES (
        v_code,
        v_brand_name,
        auth.uid(),
        now() + make_interval(days => v_days),
        true,
        'brand',
        v_owner
      )
      RETURNING * INTO v_row;

      RETURN v_row;
    EXCEPTION
      WHEN unique_violation THEN
        NULL;
    END;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_brand_teammate_invite_code(UUID, INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.link_brand_teammate_by_email(
  p_brand_account_id UUID,
  p_email TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner UUID;
  v_brand_name TEXT;
  v_email TEXT;
  v_user public.user_profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_email := lower(trim(p_email));
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  SELECT COALESCE(brand_account_id, id), COALESCE(brand_name, TRIM(first_name || ' ' || last_name), 'Brand')
    INTO v_owner, v_brand_name
  FROM public.user_profiles
  WHERE id = p_brand_account_id
    AND role = 'brand';

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Brand account not found';
  END IF;

  IF NOT (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
    OR public.current_brand_account_id() = v_owner
  ) THEN
    RAISE EXCEPTION 'Not allowed to add teammates for this brand';
  END IF;

  SELECT * INTO v_user
  FROM public.user_profiles
  WHERE lower(email) = v_email
  LIMIT 1;

  IF v_user.id IS NULL THEN
    RETURN jsonb_build_object('linked', false);
  END IF;

  IF v_user.id = v_owner THEN
    RETURN jsonb_build_object('linked', true, 'already', true, 'email', v_user.email);
  END IF;

  IF v_user.role IS DISTINCT FROM 'brand' THEN
    RAISE EXCEPTION 'That email belongs to a non-brand account';
  END IF;

  UPDATE public.user_profiles
  SET
    brand_account_id = v_owner,
    brand_name = COALESCE(v_brand_name, brand_name),
    updated_at = now()
  WHERE id = v_user.id;

  RETURN jsonb_build_object(
    'linked', true,
    'already', COALESCE(v_user.brand_account_id, v_user.id) = v_owner,
    'email', v_user.email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_brand_teammate_by_email(UUID, TEXT) TO authenticated;

DROP POLICY IF EXISTS "Brands can view their own opportunities" ON public.opportunities;
CREATE POLICY "Brands can view their own opportunities"
ON public.opportunities FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  OR organizer_id = auth.uid()
  OR organizer_id = public.current_brand_account_id()
);

DROP POLICY IF EXISTS "Brands can insert their own opportunities" ON public.opportunities;
CREATE POLICY "Brands can insert their own opportunities"
ON public.opportunities FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  OR organizer_id = auth.uid()
  OR organizer_id = public.current_brand_account_id()
);

DROP POLICY IF EXISTS "Brands can update their own opportunities" ON public.opportunities;
CREATE POLICY "Brands can update their own opportunities"
ON public.opportunities FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  OR organizer_id = auth.uid()
  OR organizer_id = public.current_brand_account_id()
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  OR organizer_id = auth.uid()
  OR organizer_id = public.current_brand_account_id()
);

DROP POLICY IF EXISTS "Brands can delete their own opportunities" ON public.opportunities;
CREATE POLICY "Brands can delete their own opportunities"
ON public.opportunities FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  OR organizer_id = auth.uid()
  OR organizer_id = public.current_brand_account_id()
);

DROP POLICY IF EXISTS "Brands can view applications for their opportunities" ON public.applications;
CREATE POLICY "Brands can view applications for their opportunities"
ON public.applications FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM opportunities
    WHERE opportunities.id = applications.opportunity_id
      AND (
        opportunities.organizer_id = auth.uid()
        OR opportunities.organizer_id = public.current_brand_account_id()
      )
  )
);

DROP POLICY IF EXISTS "Brands can update applications for their opportunities" ON public.applications;
CREATE POLICY "Brands can update applications for their opportunities"
ON public.applications FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM opportunities
    WHERE opportunities.id = applications.opportunity_id
      AND (
        opportunities.organizer_id = auth.uid()
        OR opportunities.organizer_id = public.current_brand_account_id()
      )
  )
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM opportunities
    WHERE opportunities.id = applications.opportunity_id
      AND (
        opportunities.organizer_id = auth.uid()
        OR opportunities.organizer_id = public.current_brand_account_id()
      )
  )
);

DO $$
BEGIN
  IF to_regclass('public.application_form_responses') IS NULL THEN
    RETURN;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS "Brands can view form responses for their opportunities" ON public.application_form_responses';
  EXECUTE $policy$
    CREATE POLICY "Brands can view form responses for their opportunities"
    ON public.application_form_responses FOR SELECT TO authenticated
    USING (
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
      OR user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM opportunities
        WHERE opportunities.id = application_form_responses.opportunity_id
          AND (
            opportunities.organizer_id = auth.uid()
            OR opportunities.organizer_id = public.current_brand_account_id()
          )
      )
    )
  $policy$;

  EXECUTE 'DROP POLICY IF EXISTS "Brands can update form responses for their opportunities" ON public.application_form_responses';
  EXECUTE $policy$
    CREATE POLICY "Brands can update form responses for their opportunities"
    ON public.application_form_responses FOR UPDATE TO authenticated
    USING (
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
      OR user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM opportunities
        WHERE opportunities.id = application_form_responses.opportunity_id
          AND (
            opportunities.organizer_id = auth.uid()
            OR opportunities.organizer_id = public.current_brand_account_id()
          )
      )
    )
    WITH CHECK (
      EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
      OR user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM opportunities
        WHERE opportunities.id = application_form_responses.opportunity_id
          AND (
            opportunities.organizer_id = auth.uid()
            OR opportunities.organizer_id = public.current_brand_account_id()
          )
      )
    )
  $policy$;
END $$;

DROP POLICY IF EXISTS "Brands can view their own booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Brands can view their booking requests" ON public.booking_requests;
CREATE POLICY "Brands can view their own booking requests"
ON public.booking_requests FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  OR brand_id = auth.uid()
  OR brand_id = public.current_brand_account_id()
  OR dj_id = auth.uid()
);

DROP POLICY IF EXISTS "Brands can create booking requests" ON public.booking_requests;
DROP POLICY IF EXISTS "Brands can insert booking requests" ON public.booking_requests;
CREATE POLICY "Brands can create booking requests"
ON public.booking_requests FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  OR brand_id = auth.uid()
  OR brand_id = public.current_brand_account_id()
);

DROP POLICY IF EXISTS "Brands can update pending booking requests" ON public.booking_requests;
CREATE POLICY "Brands can update pending booking requests"
ON public.booking_requests FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  OR brand_id = auth.uid()
  OR brand_id = public.current_brand_account_id()
)
WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  OR brand_id = auth.uid()
  OR brand_id = public.current_brand_account_id()
);

-- Teammates can edit the shared brand profile (name, bio, logo, agreement).
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile"
ON public.user_profiles FOR UPDATE TO authenticated
USING (
  id = auth.uid()
  OR id = public.current_brand_account_id()
)
WITH CHECK (
  id = auth.uid()
  OR id = public.current_brand_account_id()
);
