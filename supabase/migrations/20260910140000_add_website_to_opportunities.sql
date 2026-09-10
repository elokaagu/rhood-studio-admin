ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS website TEXT;

COMMENT ON COLUMN public.opportunities.website IS
  'Public event or brand website URL shown on the listing.';
