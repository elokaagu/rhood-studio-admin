-- Optional notes separate from main description; workflow state for admin UI
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS additional_info text;

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS listing_status text;

COMMENT ON COLUMN public.opportunities.additional_info IS 'Optional logistics/contact notes (separate from description).';
COMMENT ON COLUMN public.opportunities.listing_status IS 'Admin workflow: draft, active, closed, completed.';

UPDATE public.opportunities
SET listing_status = CASE
  WHEN COALESCE(is_archived, false) THEN 'draft'
  WHEN COALESCE(is_active, false) THEN 'active'
  ELSE 'closed'
END
WHERE listing_status IS NULL;

ALTER TABLE public.opportunities
  ALTER COLUMN listing_status SET DEFAULT 'draft';
