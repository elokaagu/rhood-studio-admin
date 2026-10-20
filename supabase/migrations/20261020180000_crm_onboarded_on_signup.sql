-- Move Launch CRM contacts to "Onboarded" as soon as they join R/HOOD:
-- brands when their account exists, DJs once approved (invited DJs are
-- approved on insert by resolve_dj_membership_before_insert).
-- Contacts already marked Onboarded, Active or Inactive are left alone.

CREATE OR REPLACE FUNCTION public.sync_crm_onboarding_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_note TEXT;
BEGIN
  IF NEW.email IS NULL OR to_regclass('public.crm_contacts') IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT (
    NEW.role = 'brand'
    OR (NEW.role = 'dj' AND (NEW.membership_status = 'approved' OR NEW.is_verified IS TRUE))
  ) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
    AND OLD.role IS NOT DISTINCT FROM NEW.role
    AND OLD.membership_status IS NOT DISTINCT FROM NEW.membership_status
    AND OLD.is_verified IS NOT DISTINCT FROM NEW.is_verified
    AND OLD.email IS NOT DISTINCT FROM NEW.email
  THEN
    RETURN NEW;
  END IF;

  v_note := to_char(now() AT TIME ZONE 'Europe/London', 'FMDD Mon YYYY')
    || CASE WHEN NEW.role = 'dj' THEN ': Joined R/HOOD and approved.' ELSE ': Joined R/HOOD as a brand.' END;

  UPDATE public.crm_contacts
  SET
    onboarding_status = 'Onboarded',
    notes = CASE WHEN coalesce(trim(notes), '') = '' THEN v_note ELSE notes || E'\n' || v_note END,
    updated_at = now()
  WHERE lower(trim(email)) = lower(trim(NEW.email))
    AND onboarding_status IN ('Not Contacted', 'Contacted', 'Responded');

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block a sign-up because the CRM update failed.
  RAISE WARNING 'sync_crm_onboarding_from_profile: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_crm_onboarding_from_profile ON public.user_profiles;
CREATE TRIGGER sync_crm_onboarding_from_profile
  AFTER INSERT OR UPDATE OF role, membership_status, is_verified, email
  ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_crm_onboarding_from_profile();

-- Catch up contacts who joined before this trigger existed.
UPDATE public.crm_contacts c
SET
  onboarding_status = 'Onboarded',
  notes = CASE
    WHEN coalesce(trim(c.notes), '') = '' THEN 'Already on R/HOOD when CRM sync started.'
    ELSE c.notes || E'\nAlready on R/HOOD when CRM sync started.'
  END,
  updated_at = now()
FROM public.user_profiles p
WHERE lower(trim(p.email)) = lower(trim(c.email))
  AND c.onboarding_status IN ('Not Contacted', 'Contacted', 'Responded')
  AND (
    p.role = 'brand'
    OR (p.role = 'dj' AND (p.membership_status = 'approved' OR p.is_verified IS TRUE))
  );
