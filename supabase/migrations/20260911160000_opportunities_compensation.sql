-- Free-text compensation for opportunities (e.g. "Free", "0", "Drinks + travel").
-- Numeric `payment` remains for legacy rows and sortable amounts.

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS compensation TEXT;

COMMENT ON COLUMN public.opportunities.compensation IS
  'Optional free-text compensation. Prefer this over payment when present.';
