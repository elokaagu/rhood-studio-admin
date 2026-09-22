-- Opportunity owners can approve/reject DJs without an admin role.
-- The previous RPC still required role = 'admin', so brands who owned the
-- listing were told they did not. Gig inserts from the approve trigger also
-- failed RLS; those functions now run as SECURITY DEFINER.

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS max_approvals INTEGER;

CREATE OR REPLACE FUNCTION public.opportunity_approved_dj_count(
  p_opportunity_id UUID,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_simple INTEGER := 0;
  v_form INTEGER := 0;
BEGIN
  SELECT COUNT(*)::integer
  INTO v_simple
  FROM public.applications
  WHERE opportunity_id = p_opportunity_id
    AND status = 'approved'
    AND (p_exclude_id IS NULL OR id <> p_exclude_id);

  IF to_regclass('public.application_form_responses') IS NOT NULL THEN
    EXECUTE
      'SELECT COUNT(*)::integer
       FROM public.application_form_responses
       WHERE opportunity_id = $1
         AND status = ''approved''
         AND ($2 IS NULL OR id <> $2)'
    INTO v_form
    USING p_opportunity_id, p_exclude_id;
  END IF;

  RETURN v_simple + v_form;
END;
$$;

GRANT EXECUTE ON FUNCTION public.opportunity_approved_dj_count(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_update_application_status(
  p_application_id UUID,
  p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_role TEXT := '';
  v_organizer_id UUID;
  v_created_by UUID;
  v_posted_by UUID;
  v_opportunity_id UUID;
  v_current_status TEXT;
  v_max_approvals INTEGER;
  v_approved_count INTEGER;
  v_is_owner BOOLEAN := false;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  SELECT COALESCE(role, '') INTO v_user_role
  FROM public.user_profiles
  WHERE id = v_user_id
  LIMIT 1;

  SELECT a.opportunity_id, a.status, o.organizer_id
  INTO v_opportunity_id, v_current_status, v_organizer_id
  FROM public.applications a
  LEFT JOIN public.opportunities o ON o.id = a.opportunity_id
  WHERE a.id = p_application_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found');
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'created_by'
  ) THEN
    EXECUTE 'SELECT created_by FROM public.opportunities WHERE id = $1'
      INTO v_created_by
      USING v_opportunity_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'posted_by'
  ) THEN
    EXECUTE 'SELECT posted_by FROM public.opportunities WHERE id = $1'
      INTO v_posted_by
      USING v_opportunity_id;
  END IF;

  v_is_owner :=
    v_organizer_id = v_user_id
    OR v_created_by = v_user_id
    OR v_posted_by = v_user_id;

  IF v_user_role IS DISTINCT FROM 'admin' AND NOT v_is_owner THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You can only approve DJs for opportunities you own.'
    );
  END IF;

  BEGIN
    EXECUTE 'SELECT max_approvals FROM public.opportunities WHERE id = $1'
      INTO v_max_approvals
      USING v_opportunity_id;
  EXCEPTION
    WHEN undefined_column THEN
      v_max_approvals := NULL;
    WHEN OTHERS THEN
      v_max_approvals := NULL;
  END;

  IF p_new_status = 'approved'
     AND COALESCE(v_current_status, '') IS DISTINCT FROM 'approved'
     AND v_max_approvals IS NOT NULL THEN
    v_approved_count := public.opportunity_approved_dj_count(
      v_opportunity_id,
      p_application_id
    );
    IF v_approved_count >= v_max_approvals THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', CASE
          WHEN v_max_approvals = 1 THEN
            'This opportunity already has its one approved DJ.'
          ELSE
            format('This opportunity already has %s approved DJs.', v_max_approvals)
        END
      );
    END IF;
  END IF;

  BEGIN
    UPDATE public.applications
    SET status = p_new_status, updated_at = NOW()
    WHERE id = p_application_id;
  EXCEPTION
    WHEN undefined_column THEN
      UPDATE public.applications
      SET status = p_new_status
      WHERE id = p_application_id;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Application updated successfully',
    'application_id', p_application_id,
    'new_status', p_new_status
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Database error: %s', SQLERRM)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_application_status(UUID, TEXT) TO authenticated;

DO $$
BEGIN
  IF to_regclass('public.application_form_responses') IS NULL THEN
    RETURN;
  END IF;

  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.admin_update_form_response_status(
      p_application_id UUID,
      p_new_status TEXT
    )
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $body$
    DECLARE
      v_user_id UUID := auth.uid();
      v_user_role TEXT := '';
      v_organizer_id UUID;
      v_created_by UUID;
      v_posted_by UUID;
      v_opportunity_id UUID;
      v_current_status TEXT;
      v_max_approvals INTEGER;
      v_approved_count INTEGER;
      v_is_owner BOOLEAN := false;
    BEGIN
      IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
      END IF;

      SELECT COALESCE(role, '') INTO v_user_role
      FROM public.user_profiles
      WHERE id = v_user_id
      LIMIT 1;

      SELECT r.opportunity_id, r.status, o.organizer_id
      INTO v_opportunity_id, v_current_status, v_organizer_id
      FROM public.application_form_responses r
      LEFT JOIN public.opportunities o ON o.id = r.opportunity_id
      WHERE r.id = p_application_id;

      IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Form response not found');
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'created_by'
      ) THEN
        EXECUTE 'SELECT created_by FROM public.opportunities WHERE id = $1'
          INTO v_created_by
          USING v_opportunity_id;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'posted_by'
      ) THEN
        EXECUTE 'SELECT posted_by FROM public.opportunities WHERE id = $1'
          INTO v_posted_by
          USING v_opportunity_id;
      END IF;

      v_is_owner :=
        v_organizer_id = v_user_id
        OR v_created_by = v_user_id
        OR v_posted_by = v_user_id;

      IF v_user_role IS DISTINCT FROM 'admin' AND NOT v_is_owner THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'You can only approve DJs for opportunities you own.'
        );
      END IF;

      BEGIN
        EXECUTE 'SELECT max_approvals FROM public.opportunities WHERE id = $1'
          INTO v_max_approvals
          USING v_opportunity_id;
      EXCEPTION
        WHEN undefined_column THEN
          v_max_approvals := NULL;
        WHEN OTHERS THEN
          v_max_approvals := NULL;
      END;

      IF p_new_status = 'approved'
         AND COALESCE(v_current_status, '') IS DISTINCT FROM 'approved'
         AND v_max_approvals IS NOT NULL THEN
        v_approved_count := public.opportunity_approved_dj_count(
          v_opportunity_id,
          p_application_id
        );
        IF v_approved_count >= v_max_approvals THEN
          RETURN jsonb_build_object(
            'success', false,
            'error', CASE
              WHEN v_max_approvals = 1 THEN
                'This opportunity already has its one approved DJ.'
              ELSE
                format('This opportunity already has %s approved DJs.', v_max_approvals)
            END
          );
        END IF;
      END IF;

      BEGIN
        UPDATE public.application_form_responses
        SET status = p_new_status, reviewed_at = NOW(), updated_at = NOW()
        WHERE id = p_application_id;
      EXCEPTION
        WHEN undefined_column THEN
          UPDATE public.application_form_responses
          SET status = p_new_status
          WHERE id = p_application_id;
      END;

      RETURN jsonb_build_object(
        'success', true,
        'message', 'Form response updated successfully',
        'response_id', p_application_id,
        'new_status', p_new_status
      );
    EXCEPTION
      WHEN OTHERS THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', format('Database error: %s', SQLERRM)
        );
    END;
    $body$;
  $fn$;

  EXECUTE 'GRANT EXECUTE ON FUNCTION public.admin_update_form_response_status(UUID, TEXT) TO authenticated';
END;
$$;

-- Brands who own a listing may insert gigs created by the approve trigger.
DO $$
DECLARE
  cols TEXT[];
  check_expr TEXT := 'false';
BEGIN
  IF to_regclass('public.gigs') IS NULL THEN
    RETURN;
  END IF;

  SELECT array_agg(column_name::text)
  INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'gigs';

  IF cols IS NULL THEN
    RETURN;
  END IF;

  IF 'brand_id' = ANY (cols) THEN
    check_expr := check_expr || ' OR brand_id = auth.uid()';
  END IF;
  IF 'organizer_id' = ANY (cols) THEN
    check_expr := check_expr || ' OR organizer_id = auth.uid()';
  END IF;
  IF 'created_by' = ANY (cols) THEN
    check_expr := check_expr || ' OR created_by = auth.uid()';
  END IF;
  IF 'opportunity_id' = ANY (cols) THEN
    check_expr := check_expr || $sql$
      OR EXISTS (
        SELECT 1 FROM public.opportunities o
        WHERE o.id = gigs.opportunity_id
          AND o.organizer_id = auth.uid()
      )$sql$;
  END IF;
  IF 'application_id' = ANY (cols) THEN
    check_expr := check_expr || $sql$
      OR EXISTS (
        SELECT 1
        FROM public.applications a
        JOIN public.opportunities o ON o.id = a.opportunity_id
        WHERE a.id = gigs.application_id
          AND o.organizer_id = auth.uid()
      )$sql$;
  END IF;

  check_expr := check_expr || $sql$
    OR EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )$sql$;

  EXECUTE 'DROP POLICY IF EXISTS gigs_insert_by_opportunity_owner ON public.gigs';
  EXECUTE format(
    'CREATE POLICY gigs_insert_by_opportunity_owner ON public.gigs FOR INSERT TO authenticated WITH CHECK (%s)',
    check_expr
  );
END
$$;

-- Approve triggers that write gigs must not run as the brand (RLS would block).
DO $$
DECLARE
  r RECORD;
  ident TEXT;
BEGIN
  FOR r IN
    SELECT DISTINCT
      n.nspname AS schema_name,
      p.proname AS func_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_trigger t ON t.tgfoid = p.oid
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace cn ON cn.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND cn.nspname = 'public'
      AND NOT t.tgisinternal
      AND c.relname IN ('applications', 'application_form_responses')
      AND pg_get_functiondef(p.oid) ILIKE '%gigs%'
  LOOP
    ident := format('%I.%I(%s)', r.schema_name, r.func_name, r.args);
    EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER', ident);
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', ident);
  END LOOP;
END
$$;

NOTIFY pgrst, 'reload schema';
