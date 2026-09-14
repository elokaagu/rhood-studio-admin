-- Run in Studio SQL editor:
-- https://supabase.com/dashboard/project/jsmcduecuxtaqizhmiqo/sql/new
--
-- Adds missing opportunity columns used by create/edit forms.
-- Safe to re-run.

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS website TEXT;

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS compensation TEXT;

COMMENT ON COLUMN public.opportunities.website IS
  'Public event or brand website URL shown on the listing.';

COMMENT ON COLUMN public.opportunities.compensation IS
  'Optional free-text compensation. Prefer this over payment when present.';

NOTIFY pgrst, 'reload schema';
