-- Simple mixes table creation (without policies)
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

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'mixes'
ORDER BY ordinal_position;
