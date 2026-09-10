-- Approving a DJ fires notify_dj_membership_approved with type
-- membership_approved. Studio's notifications_type_check rejects that,
-- which rolls back the membership UPDATE. Use an allowed type and never
-- fail the approval if the notification cannot be written.
-- Safe to re-run.

CREATE OR REPLACE FUNCTION public.notify_dj_membership_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.membership_status IS DISTINCT FROM 'approved'
     OR OLD.membership_status IS NOT DISTINCT FROM 'approved' THEN
    RETURN NEW;
  END IF;

  BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, related_id, is_read)
    VALUES (
      NEW.id,
      'application_approved',
      'You''re in',
      'Your R/HOOD application was approved. Open the app to get started.',
      NEW.id,
      false
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'notify_dj_membership_approved: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;
