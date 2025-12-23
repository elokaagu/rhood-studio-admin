-- Safety net: add missing venue column to opportunities
-- The PostgREST-generated view v_opportunity is referencing a venue column.
-- Adding a nullable column avoids runtime errors without changing behavior.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'opportunities'
      AND column_name = 'venue'
  ) THEN
    ALTER TABLE public.opportunities
      ADD COLUMN venue TEXT;
  END IF;
END $$;

-- Optional: note that this column is intentionally nullable and has no constraints
COMMENT ON COLUMN public.opportunities.venue IS 'Added to satisfy PostgREST view dependency (v_opportunity). Nullable.';
