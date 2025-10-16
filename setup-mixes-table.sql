-- Create mixes table in Supabase
-- Run this SQL in your Supabase SQL Editor

-- Create mixes table
CREATE TABLE IF NOT EXISTS mixes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  genre TEXT NOT NULL,
  description TEXT,
  applied_for TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  duration TEXT, -- Store as MM:SS or HH:MM:SS format
  image_url TEXT, -- URL for mix artwork/cover image
  plays INTEGER DEFAULT 0,
  rating DECIMAL(3,1) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mixes_artist ON mixes(artist);
CREATE INDEX IF NOT EXISTS idx_mixes_genre ON mixes(genre);
CREATE INDEX IF NOT EXISTS idx_mixes_status ON mixes(status);
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

-- Insert some sample data (optional - remove if you don't want sample data)
INSERT INTO mixes (
  title,
  artist,
  genre,
  description,
  applied_for,
  status,
  duration,
  image_url,
  plays,
  rating
) VALUES 
(
  'Soulection 702',
  'Eloka Agu',
  'R&B',
  'A smooth R&B mix featuring the latest tracks from Soulection Radio',
  NULL,
  'pending',
  '22:59',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
  0,
  0.0
),
(
  'Summer House Vibes',
  'Maya Rodriguez',
  'House',
  'Upbeat house mix perfect for summer parties',
  'Rooftop Summer Sessions',
  'pending',
  '45:12',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop&crop=center',
  0,
  0.0
),
(
  'Drum & Bass Energy',
  'Kai Johnson',
  'Drum & Bass',
  'High-energy drum and bass mix with heavy basslines',
  'Club Residency Audition',
  'approved',
  '52:45',
  'https://images.unsplash.com/photo-1571266028243-e68e8c6c5e0b?w=400&h=400&fit=crop&crop=center',
  0,
  0.0
),
(
  'Deep House Journey',
  'Sofia Martinez',
  'Deep House',
  'Deep, atmospheric house mix for late night sessions',
  'Rooftop Summer Sessions',
  'rejected',
  '61:18',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop&crop=center',
  0,
  0.0
);

-- Verify the data was inserted
SELECT * FROM mixes ORDER BY created_at DESC;