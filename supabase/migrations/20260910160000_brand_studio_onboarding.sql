ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS studio_agreement_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS studio_agreement_signed_by TEXT,
  ADD COLUMN IF NOT EXISTS studio_tour_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.user_profiles.studio_agreement_signed_at IS
  'When the brand typed their name to accept the R/HOOD Studio brand agreement.';
COMMENT ON COLUMN public.user_profiles.studio_agreement_signed_by IS
  'Typed legal name used as the studio brand agreement signature.';
COMMENT ON COLUMN public.user_profiles.studio_tour_completed_at IS
  'When the brand finished or skipped the first-login Studio tour.';
