-- Re-run safe: replica identity so postgres_changes includes opportunity_id.
DO $$
BEGIN
  IF to_regclass('public.applications') IS NOT NULL THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.applications REPLICA IDENTITY FULL';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'applications replica identity: %', SQLERRM;
    END;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'applications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
    END IF;
  END IF;

  IF to_regclass('public.application_form_responses') IS NOT NULL THEN
    BEGIN
      EXECUTE 'ALTER TABLE public.application_form_responses REPLICA IDENTITY FULL';
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'application_form_responses replica identity: %', SQLERRM;
    END;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'application_form_responses'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.application_form_responses;
    END IF;
  END IF;
END $$;
