-- Brand order value plus the R/HOOD fee (15%) for invoicing and payment.
-- Brands can enter the order in their own currency; it is converted to GBP.
-- The GBP amounts, fee, and exchange rate are stored at save time so a later
-- rate or fee change never rewrites what a brand agreed to.
ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS order_value NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS rhood_fee NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS order_total NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS order_currency TEXT,
  ADD COLUMN IF NOT EXISTS order_value_original NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS fx_rate_to_gbp NUMERIC(18, 8),
  ADD COLUMN IF NOT EXISTS fx_rate_date DATE;

ALTER TABLE public.opportunities
  DROP CONSTRAINT IF EXISTS opportunities_order_value_check;

ALTER TABLE public.opportunities
  ADD CONSTRAINT opportunities_order_value_check
  CHECK (
    (order_value IS NULL AND rhood_fee IS NULL AND order_total IS NULL)
    OR (order_value > 0 AND rhood_fee >= 0 AND order_total = order_value + rhood_fee)
  );

COMMENT ON COLUMN public.opportunities.order_value IS
  'Brand order value in GBP, before the R/HOOD fee.';
COMMENT ON COLUMN public.opportunities.rhood_fee IS
  'R/HOOD fee in GBP charged on top of order_value (15% at time of saving).';
COMMENT ON COLUMN public.opportunities.order_total IS
  'Amount to invoice the brand in GBP: order_value + rhood_fee.';
COMMENT ON COLUMN public.opportunities.order_currency IS
  'Currency the brand entered the order in (ISO 4217).';
COMMENT ON COLUMN public.opportunities.order_value_original IS
  'Order value as entered, in order_currency.';
COMMENT ON COLUMN public.opportunities.fx_rate_to_gbp IS
  'GBP per 1 unit of order_currency used for the conversion (1 for GBP).';
COMMENT ON COLUMN public.opportunities.fx_rate_date IS
  'Date of the exchange rate used (null for GBP).';

NOTIFY pgrst, 'reload schema';
