-- Align Studio with DJ app: friend invite_code (user_profiles) skips waitlist,
-- referral credits write to credit_transactions, and gigs_completed follows
-- applications.gig_completed from "mark gig as done".

CREATE OR REPLACE FUNCTION public.resolve_dj_membership_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_code TEXT;
  v_invite_id UUID;
  v_code_id UUID;
  v_referrer_id UUID;
BEGIN
  IF NEW.role IN ('admin', 'brand') THEN
    NEW.membership_status := 'approved';
    NEW.membership_source := COALESCE(NEW.membership_source, 'staff');
    RETURN NEW;
  END IF;

  v_email := lower(btrim(COALESCE(NEW.email, '')));
  v_code := upper(btrim(COALESCE(NEW.invite_code_used, '')));

  IF v_email <> '' THEN
    SELECT id INTO v_invite_id
    FROM public.dj_invites
    WHERE lower(email) = v_email
      AND used_at IS NULL
    LIMIT 1;

    IF v_invite_id IS NOT NULL THEN
      NEW.membership_status := 'approved';
      NEW.membership_source := 'invite';
      NEW.membership_reviewed_at := now();
      RETURN NEW;
    END IF;
  END IF;

  IF v_code <> '' THEN
    SELECT id INTO v_code_id
    FROM public.invite_codes
    WHERE upper(code) = v_code
      AND invite_type = 'dj'
      AND COALESCE(is_active, false) = true
      AND used_by IS NULL
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;

    IF v_code_id IS NOT NULL THEN
      NEW.membership_status := 'approved';
      NEW.membership_source := 'invite_code';
      NEW.membership_reviewed_at := now();
      RETURN NEW;
    END IF;

    SELECT id INTO v_referrer_id
    FROM public.user_profiles
    WHERE upper(btrim(COALESCE(invite_code, ''))) = v_code
    LIMIT 1;

    IF v_referrer_id IS NOT NULL THEN
      NEW.membership_status := 'approved';
      NEW.membership_source := 'invite_code';
      NEW.membership_reviewed_at := now();
      RETURN NEW;
    END IF;
  END IF;

  NEW.membership_status := 'pending';
  NEW.membership_source := 'application';
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.credit_transactions') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.credit_transactions
    DROP CONSTRAINT IF EXISTS credit_transactions_transaction_type_check;

  ALTER TABLE public.credit_transactions
    ADD CONSTRAINT credit_transactions_transaction_type_check
    CHECK (transaction_type IN (
      'gig_completed',
      'rating_received',
      'boost_used',
      'manual_adjustment',
      'endorsement',
      'streak_bonus',
      'referral'
    ));
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE OR REPLACE FUNCTION public.process_referral(
  invite_code_param VARCHAR(20),
  new_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referrer_id UUID;
  referral_exists BOOLEAN;
  credits_to_award INTEGER := 25;
  caller UUID := auth.uid();
  normalized VARCHAR(20);
  v_inserted INTEGER;
BEGIN
  IF caller IS NULL OR caller <> new_user_id THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  normalized := UPPER(BTRIM(invite_code_param));

  IF EXISTS(
    SELECT 1 FROM public.user_profiles
    WHERE id = new_user_id AND invite_code = normalized
  ) THEN
    RETURN false;
  END IF;

  IF to_regclass('public.referrals') IS NULL THEN
    RETURN false;
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.referrals WHERE referred_id = new_user_id)
  INTO referral_exists;

  IF referral_exists THEN
    RETURN false;
  END IF;

  SELECT id INTO referrer_id
  FROM public.user_profiles
  WHERE invite_code = normalized;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO public.referrals (referrer_id, referred_id, invite_code, credits_awarded)
  VALUES (referrer_id, new_user_id, normalized, true)
  ON CONFLICT (referred_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN
    RETURN false;
  END IF;

  UPDATE public.user_profiles
  SET credits = COALESCE(credits, 0) + credits_to_award,
      updated_at = NOW()
  WHERE id = referrer_id;

  IF to_regclass('public.credit_transactions') IS NOT NULL THEN
    BEGIN
      INSERT INTO public.credit_transactions (
        user_id, amount, transaction_type, description, reference_id, reference_type
      )
      VALUES (
        referrer_id,
        credits_to_award,
        'referral',
        'DJ invite: ' || normalized,
        new_user_id,
        'referral'
      );
    EXCEPTION WHEN others THEN
      NULL;
    END;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_referral(VARCHAR, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_gigs_completed_from_applications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID;
  v_count INTEGER;
BEGIN
  v_user := COALESCE(NEW.user_id, OLD.user_id);
  IF v_user IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.applications
  WHERE user_id = v_user
    AND COALESCE(status, '') = 'approved'
    AND COALESCE(gig_completed, false) = true;

  UPDATE public.user_profiles
  SET gigs_completed = v_count,
      updated_at = NOW()
  WHERE id = v_user;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_gigs_completed_from_applications ON public.applications;
CREATE TRIGGER trigger_sync_gigs_completed_from_applications
AFTER INSERT OR UPDATE OF gig_completed, status OR DELETE
ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.sync_gigs_completed_from_applications();

UPDATE public.user_profiles up
SET gigs_completed = sub.completed_count
FROM (
  SELECT user_id, COUNT(*)::INTEGER AS completed_count
  FROM public.applications
  WHERE COALESCE(status, '') = 'approved'
    AND COALESCE(gig_completed, false) = true
  GROUP BY user_id
) sub
WHERE up.id = sub.user_id;
