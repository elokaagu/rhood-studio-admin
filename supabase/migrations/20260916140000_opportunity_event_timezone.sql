-- IANA timezone for opportunity wall-clock times (e.g. 00:00 stays 00:00
-- in the event zone instead of shifting when stored as UTC).
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS event_timezone TEXT;
