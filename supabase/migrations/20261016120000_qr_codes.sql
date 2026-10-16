-- Flyer / activation QR codes that redirect through the portal for tracking.

CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
  destination_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS qr_codes_opportunity_idx ON public.qr_codes (opportunity_id);
CREATE INDEX IF NOT EXISTS qr_codes_active_idx ON public.qr_codes (is_active);

CREATE TABLE IF NOT EXISTS public.qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  visitor_hash TEXT,
  converted_at TIMESTAMPTZ,
  conversion_type TEXT
);

CREATE INDEX IF NOT EXISTS qr_scans_code_idx ON public.qr_scans (qr_code_id, scanned_at DESC);
CREATE INDEX IF NOT EXISTS qr_scans_visitor_idx ON public.qr_scans (visitor_hash);

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage qr codes" ON public.qr_codes;
CREATE POLICY "Admins manage qr codes"
  ON public.qr_codes FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins read qr scans" ON public.qr_scans;
CREATE POLICY "Admins read qr scans"
  ON public.qr_scans FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );
