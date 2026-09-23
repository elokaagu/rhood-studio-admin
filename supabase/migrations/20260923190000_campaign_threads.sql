-- Campaign runner: one thread per approved placement, plus every
-- outbound intro and inbound reply R/HOOD is copied on.

CREATE TABLE IF NOT EXISTS public.campaign_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID,
  application_id TEXT,
  brand_email TEXT,
  dj_email TEXT,
  subject TEXT,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS campaign_threads_application_idx
  ON public.campaign_threads (application_id)
  WHERE application_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS campaign_threads_opportunity_idx
  ON public.campaign_threads (opportunity_id);

CREATE TABLE IF NOT EXISTS public.campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.campaign_threads(id) ON DELETE CASCADE,
  direction TEXT NOT NULL DEFAULT 'inbound',
  from_email TEXT,
  to_emails TEXT[] DEFAULT '{}',
  cc_emails TEXT[] DEFAULT '{}',
  subject TEXT,
  body_text TEXT,
  resend_id TEXT,
  received_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_messages_thread_idx
  ON public.campaign_messages (thread_id, received_at DESC);

ALTER TABLE public.campaign_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read campaign threads" ON public.campaign_threads;
CREATE POLICY "Admins can read campaign threads"
  ON public.campaign_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can read campaign messages" ON public.campaign_messages;
CREATE POLICY "Admins can read campaign messages"
  ON public.campaign_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
