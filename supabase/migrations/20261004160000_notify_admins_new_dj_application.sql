-- Email R/HOOD admins via Studio when a DJ signs up and lands in the review queue.
-- Safe to re-run. Inserts still succeed if pg_net / HTTP cannot run.

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_net;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_net not available (%). Trigger is still created.', SQLERRM;
END $$;

CREATE OR REPLACE FUNCTION public.notify_admins_of_new_dj_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, extensions
AS $$
DECLARE
  v_url TEXT := 'https://portal.rhood.io/api/notifications/dj-application-new';
BEGIN
  IF NEW.membership_status IS DISTINCT FROM 'pending'
     OR COALESCE(NEW.role, 'dj') <> 'dj' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.membership_status IS NOT DISTINCT FROM 'pending' THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := v_url,
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object('userId', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_admins_of_new_dj_application: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_admins_on_dj_application ON public.user_profiles;
CREATE TRIGGER notify_admins_on_dj_application
AFTER INSERT OR UPDATE OF membership_status ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_of_new_dj_application();
