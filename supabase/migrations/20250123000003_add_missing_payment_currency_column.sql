-- Safety net: add missing payment_currency column to opportunities
-- PostgREST-generated views are referencing a payment_currency column.
-- Adding a nullable column avoids runtime errors without changing behavior.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'opportunities'
      AND column_name = 'payment_currency'
  ) THEN
    ALTER TABLE public.opportunities
      ADD COLUMN payment_currency TEXT;
  END IF;
END $$;

-- Optional: note that this column is intentionally nullable and has no constraints
COMMENT ON COLUMN public.opportunities.payment_currency IS 'Added to satisfy PostgREST view dependency (v_opportunity). Nullable.';
