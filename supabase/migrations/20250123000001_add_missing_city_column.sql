-- Safety net: add missing city column to opportunities
-- PostgREST-generated views are referencing a city column.
-- Adding a nullable column avoids runtime errors without changing behavior.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'opportunities'
      AND column_name = 'city'
  ) THEN
    ALTER TABLE public.opportunities
      ADD COLUMN city TEXT;
  END IF;
END $$;

-- Optional: note that this column is intentionally nullable and has no constraints
COMMENT ON COLUMN public.opportunities.city IS 'Added to satisfy PostgREST view dependency (v_opportunity). Nullable.';
