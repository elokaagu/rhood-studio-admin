-- One row per campaign milestone R/HOOD sends or confirms for a placement
-- (approval email, intro email). Replaces the notifications-table records,
-- which its type check has always rejected.

CREATE TABLE IF NOT EXISTS public.campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT NOT NULL,
  opportunity_id UUID,
  kind TEXT NOT NULL CHECK (kind IN ('approval_email', 'intro_email')),
  source TEXT NOT NULL DEFAULT 'sent' CHECK (source IN ('sent', 'marked')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS campaign_events_application_kind_idx
  ON public.campaign_events (application_id, kind);

CREATE INDEX IF NOT EXISTS campaign_events_opportunity_idx
  ON public.campaign_events (opportunity_id);

ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read campaign events" ON public.campaign_events;
CREATE POLICY "Admins can read campaign events"
  ON public.campaign_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

INSERT INTO public.campaign_events (application_id, opportunity_id, kind, source, created_at)
SELECT t.application_id, t.opportunity_id, 'intro_email', 'sent', MIN(m.received_at)
FROM public.campaign_threads t
JOIN public.campaign_messages m ON m.thread_id = t.id AND m.direction = 'outbound'
WHERE t.application_id IS NOT NULL
GROUP BY t.application_id, t.opportunity_id
ON CONFLICT (application_id, kind) DO NOTHING;
