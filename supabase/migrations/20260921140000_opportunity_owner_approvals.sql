-- Brands (and any opportunity owner) can approve/reject applicants without
-- being an admin. Also store how many DJs a listing may approve.
-- application_form_responses is optional (Studio has it; the rhood app DB may not).
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS max_approvals INTEGER;

ALTER TABLE public.opportunities
  DROP CONSTRAINT IF EXISTS opportunities_max_approvals_check;

ALTER TABLE public.opportunities
  ADD CONSTRAINT opportunities_max_approvals_check
  CHECK (max_approvals IS NULL OR max_approvals >= 1);

COMMENT ON COLUMN public.opportunities.max_approvals IS
  'Max DJs that can be approved. NULL means unlimited.';

CREATE OR REPLACE FUNCTION public.opportunity_approved_dj_count(
  p_opportunity_id UUID,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
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

CREATE OR REPLACE FUNCTION public.admin_update_application_status(
  p_application_id UUID,
  p_new_status TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_organizer_id UUID;
  v_opportunity_id UUID;
  v_current_status TEXT;
  v_max_approvals INTEGER;
  v_approved_count INTEGER;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not authenticated'
    );
  END IF;

  SELECT COALESCE(role, '') INTO v_user_role
  FROM public.user_profiles
  WHERE id = v_user_id
  LIMIT 1;

  SELECT a.opportunity_id, a.status, o.organizer_id, o.max_approvals
  INTO v_opportunity_id, v_current_status, v_organizer_id, v_max_approvals
  FROM public.applications a
  LEFT JOIN public.opportunities o ON o.id = a.opportunity_id
  WHERE a.id = p_application_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Application not found'
    );
  END IF;

  IF v_user_role IS DISTINCT FROM 'admin' AND v_organizer_id IS DISTINCT FROM v_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You can only approve DJs for opportunities you own.'
    );
  END IF;

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

  UPDATE public.applications
  SET
    status = p_new_status,
    updated_at = NOW()
  WHERE id = p_application_id;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.opportunity_approved_dj_count(UUID, UUID) TO authenticated;
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
    RETURNS JSONB AS $body$
    DECLARE
      v_user_id UUID;
      v_user_role TEXT;
      v_organizer_id UUID;
      v_opportunity_id UUID;
      v_current_status TEXT;
      v_max_approvals INTEGER;
      v_approved_count INTEGER;
    BEGIN
      v_user_id := auth.uid();

      IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'User not authenticated'
        );
      END IF;

      SELECT COALESCE(role, '') INTO v_user_role
      FROM public.user_profiles
      WHERE id = v_user_id
      LIMIT 1;

      SELECT r.opportunity_id, r.status, o.organizer_id, o.max_approvals
      INTO v_opportunity_id, v_current_status, v_organizer_id, v_max_approvals
      FROM public.application_form_responses r
      LEFT JOIN public.opportunities o ON o.id = r.opportunity_id
      WHERE r.id = p_application_id;

      IF NOT FOUND THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'Form response not found'
        );
      END IF;

      IF v_user_role IS DISTINCT FROM 'admin' AND v_organizer_id IS DISTINCT FROM v_user_id THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'You can only approve DJs for opportunities you own.'
        );
      END IF;

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

      UPDATE public.application_form_responses
      SET
        status = p_new_status,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id = p_application_id;

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
    $body$ LANGUAGE plpgsql SECURITY DEFINER;
  $fn$;

  EXECUTE 'GRANT EXECUTE ON FUNCTION public.admin_update_form_response_status(UUID, TEXT) TO authenticated';
END;
$$;

NOTIFY pgrst, 'reload schema';
