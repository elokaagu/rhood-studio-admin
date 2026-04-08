-- Operational schedule fields (setup, soundcheck, capacity, notes) separate from core listing columns
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS schedule_details jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.opportunities.schedule_details IS
  'JSON: setup_time, soundcheck_time, capacity, notes, schedule_status (draft|scheduled|confirmed|completed).';
