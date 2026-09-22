-- Ensure max_approvals exists and PostgREST can see it.
-- Safe to run even if 20260921140000 already added the column.
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS max_approvals INTEGER;

ALTER TABLE public.opportunities
  DROP CONSTRAINT IF EXISTS opportunities_max_approvals_check;

ALTER TABLE public.opportunities
  ADD CONSTRAINT opportunities_max_approvals_check
  CHECK (max_approvals IS NULL OR max_approvals >= 1);

COMMENT ON COLUMN public.opportunities.max_approvals IS
  'Max DJs that can be approved. NULL means unlimited.';

NOTIFY pgrst, 'reload schema';
