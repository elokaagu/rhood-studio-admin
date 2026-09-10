-- Email brands via Studio when a DJ applies to an opportunity.
-- Safe to re-run. Inserts still succeed if pg_net / HTTP cannot run.
--
-- Studio may not have pg_net enabled (the DJ app database often does).
-- Do not fail the whole script if the extension cannot be created.

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_net;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_net not available (%). Triggers are still created.', SQLERRM;
END $$;

CREATE OR REPLACE FUNCTION public.notify_brand_of_new_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
DECLARE
  v_url TEXT := 'https://portal.rhood.io/api/notifications/brand-new-application';
BEGIN
  IF NEW.opportunity_id IS NULL OR NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'applicationId', NEW.id,
        'opportunityId', NEW.opportunity_id,
        'applicantUserId', NEW.user_id,
        'source', TG_TABLE_NAME
      )
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_brand_of_new_application: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.applications') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS notify_brand_on_application_insert ON public.applications;
    CREATE TRIGGER notify_brand_on_application_insert
    AFTER INSERT ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_brand_of_new_application();
  END IF;

  IF to_regclass('public.application_form_responses') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS notify_brand_on_form_application_insert ON public.application_form_responses;
    CREATE TRIGGER notify_brand_on_form_application_insert
    AFTER INSERT ON public.application_form_responses
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_brand_of_new_application();
  END IF;
END $$;
