-- Brands who own an opportunity can approve DJs (a trigger may insert into
-- gigs) and can message applicants. The gigs insert was failing RLS because
-- the trigger ran as the brand, not as a table owner.

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS max_approvals INTEGER;

-- 1) Opportunity owners / admins may insert and read gigs tied to their listings.
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

  -- If the table has no owner/opportunity link, still let brands/admins insert
  -- so approving an application is not blocked by DJ-only RLS.
  IF NOT (
    'opportunity_id' = ANY (cols)
    OR 'application_id' = ANY (cols)
    OR 'brand_id' = ANY (cols)
    OR 'organizer_id' = ANY (cols)
  ) THEN
    check_expr := check_expr || $sql$
      OR EXISTS (
        SELECT 1 FROM public.user_profiles p
        WHERE p.id = auth.uid()
          AND (
            p.role IN ('admin', 'brand')
            OR coalesce(p.brand_name, '') <> ''
          )
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

  EXECUTE 'DROP POLICY IF EXISTS gigs_select_by_opportunity_owner ON public.gigs';
  EXECUTE format(
    'CREATE POLICY gigs_select_by_opportunity_owner ON public.gigs FOR SELECT TO authenticated USING (%s)',
    check_expr
  );
END
$$;

-- 2) Any trigger that writes gigs on application approval must run as definer
--    so RLS does not block the brand who caused the update.
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
    ident := format(
      '%I.%I(%s)',
      r.schema_name,
      r.func_name,
      r.args
    );
    EXECUTE format('ALTER FUNCTION %s SECURITY DEFINER', ident);
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', ident);
  END LOOP;
END
$$;

-- 3) Brands can open a DJ chat for applicants on their own listings, including
--    when they applied with the same account while testing.
CREATE OR REPLACE FUNCTION public.has_application_conversation_access(
  other_user_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me UUID := auth.uid();
  has_organizer_id BOOLEAN;
  has_created_by BOOLEAN;
  has_posted_by BOOLEAN;
  has_form_responses BOOLEAN;
  is_admin BOOLEAN;
  organizer_clause TEXT := 'FALSE';
  other_organizer_clause TEXT := 'FALSE';
  sql TEXT;
  allowed BOOLEAN := false;
BEGIN
  IF me IS NULL OR other_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'organizer_id'
  ) INTO has_organizer_id;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'created_by'
  ) INTO has_created_by;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'opportunities' AND column_name = 'posted_by'
  ) INTO has_posted_by;
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'application_form_responses'
  ) INTO has_form_responses;

  IF has_organizer_id THEN
    organizer_clause := organizer_clause || ' OR o.organizer_id = $1';
    other_organizer_clause := other_organizer_clause || ' OR o.organizer_id = $2';
  END IF;
  IF has_created_by THEN
    organizer_clause := organizer_clause || ' OR o.created_by = $1';
    other_organizer_clause := other_organizer_clause || ' OR o.created_by = $2';
  END IF;
  IF has_posted_by THEN
    organizer_clause := organizer_clause || ' OR o.posted_by = $1';
    other_organizer_clause := other_organizer_clause || ' OR o.posted_by = $2';
  END IF;

  sql := format(
    'SELECT EXISTS (
       SELECT 1
       FROM public.applications a
       JOIN public.opportunities o ON o.id = a.opportunity_id
       WHERE (
         a.user_id = $2 AND (%s)
       ) OR (
         a.user_id = $1 AND (%s)
       )
     )',
    organizer_clause,
    other_organizer_clause
  );

  EXECUTE sql INTO allowed USING me, other_user_id;

  IF NOT COALESCE(allowed, false) AND has_form_responses THEN
    sql := format(
      'SELECT EXISTS (
         SELECT 1
         FROM public.application_form_responses a
         JOIN public.opportunities o ON o.id = a.opportunity_id
         WHERE (
           a.user_id = $2 AND (%s)
         ) OR (
           a.user_id = $1 AND (%s)
         )
       )',
      organizer_clause,
      other_organizer_clause
    );
    EXECUTE sql INTO allowed USING me, other_user_id;
  END IF;

  IF NOT COALESCE(allowed, false) THEN
    SELECT EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = me AND role = 'admin'
    ) INTO is_admin;

    IF COALESCE(is_admin, false) THEN
      SELECT EXISTS (
        SELECT 1 FROM public.applications WHERE user_id = other_user_id
      ) INTO allowed;

      IF NOT COALESCE(allowed, false) AND has_form_responses THEN
        SELECT EXISTS (
          SELECT 1 FROM public.application_form_responses WHERE user_id = other_user_id
        ) INTO allowed;
      END IF;
    END IF;
  END IF;

  RETURN COALESCE(allowed, false);
END;
$$;

REVOKE ALL ON FUNCTION public.has_application_conversation_access(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_application_conversation_access(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
