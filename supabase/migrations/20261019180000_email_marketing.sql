-- Resend marketing setup: settings, contact sync state, and email event analytics.

-- Server-only key/value store (domain ids, segment ids, webhook signing secret).
-- No policies: only the service role can read or write it.
CREATE TABLE IF NOT EXISTS public.email_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

-- What was last pushed to Resend for each Studio user, so syncs only send changes.
CREATE TABLE IF NOT EXISTS public.email_contact_sync (
  user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  resend_contact_id TEXT,
  segment_ids TEXT[] NOT NULL DEFAULT '{}',
  fingerprint TEXT,
  synced_at TIMESTAMPTZ,
  last_error TEXT
);
ALTER TABLE public.email_contact_sync ENABLE ROW LEVEL SECURITY;

-- Delivery, open, click, bounce and complaint events from the Resend webhook.
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id TEXT UNIQUE,
  type TEXT NOT NULL,
  email_id TEXT,
  broadcast_id TEXT,
  recipient TEXT,
  subject TEXT,
  link TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_events_broadcast_idx ON public.email_events (broadcast_id, type);
CREATE INDEX IF NOT EXISTS email_events_occurred_idx ON public.email_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS email_events_email_idx ON public.email_events (email_id);
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE VIEW public.email_broadcast_stats WITH (security_invoker = true) AS
SELECT broadcast_id, type, count(*) AS events, count(DISTINCT recipient) AS recipients
FROM public.email_events
WHERE broadcast_id IS NOT NULL
GROUP BY broadcast_id, type;

-- Last 30 days split into marketing (broadcasts) and product (approvals, bookings, invites).
CREATE OR REPLACE VIEW public.email_recent_stats WITH (security_invoker = true) AS
SELECT
  CASE WHEN broadcast_id IS NULL THEN 'product' ELSE 'marketing' END AS stream,
  type,
  count(*) AS events,
  count(DISTINCT recipient) AS recipients
FROM public.email_events
WHERE occurred_at > now() - interval '30 days'
GROUP BY 1, 2;

DROP POLICY IF EXISTS "Admins read email events" ON public.email_events;
CREATE POLICY "Admins read email events"
  ON public.email_events FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );
