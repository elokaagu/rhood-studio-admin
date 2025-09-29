-- Create opportunities table in Supabase
-- Run this SQL in your Supabase SQL Editor

-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  payment DECIMAL(10,2),
  genre TEXT,
  skill_level TEXT,
  organizer_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_opportunities_is_active ON opportunities(is_active);
CREATE INDEX IF NOT EXISTS idx_opportunities_genre ON opportunities(genre);
CREATE INDEX IF NOT EXISTS idx_opportunities_event_date ON opportunities(event_date);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at);

-- Enable Row Level Security
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all opportunities" ON opportunities
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert opportunities" ON opportunities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update opportunities" ON opportunities
  FOR UPDATE USING (true);

CREATE POLICY "Admins can delete opportunities" ON opportunities
  FOR DELETE USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_opportunities_updated_at 
  BEFORE UPDATE ON opportunities 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
