-- Create application_forms table
CREATE TABLE IF NOT EXISTS application_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create application_form_fields table
CREATE TABLE IF NOT EXISTS application_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES application_forms(id) ON DELETE CASCADE,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'select', 'checkbox', 'radio', 'file', 'date', 'number')),
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_placeholder TEXT,
  field_options JSONB, -- For select, radio, checkbox options
  is_required BOOLEAN DEFAULT false,
  field_order INTEGER NOT NULL,
  validation_rules JSONB, -- For custom validation rules
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create application_form_responses table
CREATE TABLE IF NOT EXISTS application_form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES application_forms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  response_data JSONB NOT NULL, -- Store all form responses as JSON
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_application_forms_opportunity_id ON application_forms(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_application_forms_active ON application_forms(is_active);
CREATE INDEX IF NOT EXISTS idx_application_form_fields_form_id ON application_form_fields(form_id);
CREATE INDEX IF NOT EXISTS idx_application_form_fields_order ON application_form_fields(form_id, field_order);
CREATE INDEX IF NOT EXISTS idx_application_form_responses_form_id ON application_form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_application_form_responses_user_id ON application_form_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_application_form_responses_opportunity_id ON application_form_responses(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_application_form_responses_status ON application_form_responses(status);

-- Enable Row Level Security (RLS)
ALTER TABLE application_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_form_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for application_forms
CREATE POLICY "Application forms are viewable by everyone" ON application_forms
  FOR SELECT USING (true);

CREATE POLICY "Application forms are manageable by admins" ON application_forms
  FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for application_form_fields
CREATE POLICY "Application form fields are viewable by everyone" ON application_form_fields
  FOR SELECT USING (true);

CREATE POLICY "Application form fields are manageable by admins" ON application_form_fields
  FOR ALL USING (auth.role() = 'authenticated');

-- Create RLS policies for application_form_responses
CREATE POLICY "Users can view their own form responses" ON application_form_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own form responses" ON application_form_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all form responses" ON application_form_responses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage all form responses" ON application_form_responses
  FOR ALL USING (auth.role() = 'authenticated');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_application_forms_updated_at
  BEFORE UPDATE ON application_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_form_fields_updated_at
  BEFORE UPDATE ON application_form_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_form_responses_updated_at
  BEFORE UPDATE ON application_form_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
