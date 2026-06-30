-- Run this in the Supabase SQL editor before using Stripe subscriptions.
--
-- After running this SQL you must also:
--   1. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in the Supabase dashboard
--      (Project Settings → Edge Functions → Secrets)
--   2. Add NEXT_PUBLIC_STRIPE_PRICE_ID=<your_price_id> to .env.local
--   3. Deploy the three edge functions:
--        supabase functions deploy create-checkout-session
--        supabase functions deploy stripe-webhook
--        supabase functions deploy brand-subscription-status
--   4. Register the webhook in the Stripe dashboard pointing at:
--        https://<your-project-ref>.supabase.co/functions/v1/stripe-webhook
--      and enable these events:
--        customer.subscription.created
--        customer.subscription.updated
--        customer.subscription.deleted
--        invoice.payment_succeeded
--        invoice.payment_failed

CREATE TABLE IF NOT EXISTS brand_subscriptions (
  id                             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                        UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  stripe_customer_id             TEXT,
  stripe_subscription_id         TEXT,
  stripe_price_id                TEXT,
  status                         TEXT        NOT NULL DEFAULT 'inactive',
  current_period_start           TIMESTAMPTZ,
  current_period_end             TIMESTAMPTZ,
  opportunities_used_this_period INTEGER     NOT NULL DEFAULT 0,
  updated_at                     TIMESTAMPTZ DEFAULT NOW(),
  created_at                     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brand_subscriptions ENABLE ROW LEVEL SECURITY;

-- Brands can read their own subscription row
DROP POLICY IF EXISTS "Brands can view own subscription" ON brand_subscriptions;
CREATE POLICY "Brands can view own subscription"
ON brand_subscriptions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Edge functions use the service role key (bypasses RLS) for all writes,
-- so no INSERT/UPDATE policies are needed for authenticated users.
