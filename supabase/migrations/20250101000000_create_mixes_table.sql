-- Create mixes table
CREATE TABLE IF NOT EXISTS mixes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  genre TEXT NOT NULL,
  description TEXT,
  applied_for TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  duration TEXT,
  plays INTEGER DEFAULT 0,
  rating DECIMAL(3,1) DEFAULT 0.0,
  uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mixes_status ON mixes(status);
CREATE INDEX IF NOT EXISTS idx_mixes_genre ON mixes(genre);
CREATE INDEX IF NOT EXISTS idx_mixes_uploaded_by ON mixes(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_mixes_created_at ON mixes(created_at);

-- Enable Row Level Security
ALTER TABLE mixes ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all mixes" ON mixes
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert mixes" ON mixes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update mixes" ON mixes
  FOR UPDATE USING (true);

CREATE POLICY "Admins can delete mixes" ON mixes
  FOR DELETE USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mixes_updated_at 
  BEFORE UPDATE ON mixes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
