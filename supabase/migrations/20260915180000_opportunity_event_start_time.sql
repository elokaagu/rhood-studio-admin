-- DJ app reads event_start_time as the gig clock. Studio previously only
-- wrote event_date / event_end_time, so the app fell back to a default time.
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS event_start_time TIMESTAMPTZ;

UPDATE public.opportunities
SET event_start_time = event_date::timestamptz
WHERE event_start_time IS NULL
  AND event_date IS NOT NULL;
