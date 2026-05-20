-- CRM Contacts table for beta tester tracking
CREATE TABLE IF NOT EXISTS crm_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT,
  category TEXT NOT NULL DEFAULT 'DJ',
  phone_number TEXT,
  email TEXT,
  onboarding_status TEXT NOT NULL DEFAULT 'Not Contacted',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: admins only
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage crm_contacts"
  ON crm_contacts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
  );

-- Keep updated_at in sync
CREATE OR REPLACE FUNCTION update_crm_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crm_contacts_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_crm_contacts_updated_at();

-- Seed beta tester contacts
INSERT INTO crm_contacts (first_name, last_name, category, phone_number, email, onboarding_status) VALUES
  ('Selecta',  'Suave',    'DJ',    '7881831194', 'selectauave@gmail.com',               'Contacted'),
  ('Savannah', 'Harriot',  'DJ',    '7866507944', 'hello@savssounds.com',                'Contacted'),
  ('Sina',     'Soundboks','Brand', NULL,          'sina@soundboks.com',                  'Responded'),
  ('Virginie', 'Hercules', 'Brand', NULL,          'virginie.belliveau@guillemot.com',    'Contacted'),
  ('Sandra',   'Woo',      'DJ',    NULL,          'sandra.woo@snafurecords.com',         'Responded'),
  ('Vivian',   'Reis',     'DJ',    NULL,          'vivireisux@gmail.com',                'Contacted'),
  ('Sam',      'Mirson',   'DJ',    NULL,          NULL,                                  'Not Contacted'),
  ('My',       'Kellner',  'DJ',    NULL,          'aelvakmusic@gmail.com',               'Not Contacted'),
  ('Juan',     'Diego',    'DJ',    NULL,          NULL,                                  'Not Contacted'),
  ('Sandra',   'Woo',      'DJ',    NULL,          NULL,                                  'Not Contacted'),
  ('Mira',     'SNAFU',    'Brand', NULL,          NULL,                                  'Not Contacted'),
  ('Bejay',    'Mulenga',  'DJ',    NULL,          NULL,                                  'Not Contacted')
ON CONFLICT DO NOTHING;
