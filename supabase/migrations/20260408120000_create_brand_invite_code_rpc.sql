-- Server-side invite code creation with DB-enforced uniqueness.
-- This function retries on unique constraint conflicts for `invite_codes.code`.

CREATE OR REPLACE FUNCTION public.create_brand_invite_code(
  p_brand_name TEXT,
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
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF COALESCE(btrim(p_brand_name), '') = '' THEN
    RAISE EXCEPTION 'Brand name is required';
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

  LOOP
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Failed to generate unique invite code after retries';
    END IF;

    -- 8 chars from an unambiguous alphabet.
    SELECT string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (1 + floor(random() * 32))::int, 1), '')
    INTO v_code
    FROM generate_series(1, 8);

    BEGIN
      INSERT INTO public.invite_codes (
        code,
        brand_name,
        created_by,
        expires_at,
        is_active
      )
      VALUES (
        v_code,
        btrim(p_brand_name),
        auth.uid(),
        now() + make_interval(days => v_days),
        true
      )
      RETURNING *
      INTO v_row;

      RETURN v_row;
    EXCEPTION
      WHEN unique_violation THEN
        -- Retry on code collision.
        NULL;
    END;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_brand_invite_code(TEXT, INTEGER) TO authenticated;
