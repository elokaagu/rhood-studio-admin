-- Safety net: add missing event_start_time column to opportunities
-- PostgREST-generated views are referencing an event_start_time column.
-- Adding a nullable column avoids runtime errors without changing behavior.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'opportunities'
      AND column_name = 'event_start_time'
  ) THEN
    ALTER TABLE public.opportunities
      ADD COLUMN event_start_time TIMESTAMPTZ;
  END IF;
END $$;

-- Optional: note that this column is intentionally nullable and has no constraints
COMMENT ON COLUMN public.opportunities.event_start_time IS 'Added to satisfy PostgREST view dependency (v_opportunity). Nullable.';
