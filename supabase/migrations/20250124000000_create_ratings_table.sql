-- Create ratings table for DJ and Brand ratings
-- This table stores ratings given by brands to DJs and by DJs to brands

CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE, -- Who is giving the rating
  ratee_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE, -- Who is being rated
  rating_type TEXT NOT NULL CHECK (rating_type IN ('dj_rating', 'brand_rating')),
  -- dj_rating: Brand/Admin rating the DJ
  -- brand_rating: DJ rating the Brand
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT, -- Optional comment/feedback
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure one rating per application per type (a brand can only rate a DJ once per application, and vice versa)
  UNIQUE(application_id, rating_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ratings_application_id ON ratings(application_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater_id ON ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_ratee_id ON ratings(ratee_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rating_type ON ratings(rating_type);
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at);

-- Enable Row Level Security
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Users can view ratings they gave or received
CREATE POLICY "Users can view their own ratings"
ON ratings
FOR SELECT
TO authenticated
USING (
  rater_id = auth.uid() OR 
  ratee_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Brands/Admins can create DJ ratings when marking gig complete
CREATE POLICY "Brands and admins can create DJ ratings"
ON ratings
FOR INSERT
TO authenticated
WITH CHECK (
  rating_type = 'dj_rating' AND
  (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'brand')
    )
  )
);

-- DJs can create brand ratings after gig completion
CREATE POLICY "DJs can create brand ratings"
ON ratings
FOR INSERT
TO authenticated
WITH CHECK (
  rating_type = 'brand_rating' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'dj'
  )
);

-- Users can update their own ratings (within a time window)
CREATE POLICY "Users can update their own ratings"
ON ratings
FOR UPDATE
TO authenticated
USING (rater_id = auth.uid())
WITH CHECK (
  rater_id = auth.uid() AND
  created_at > NOW() - INTERVAL '24 hours' -- Can only update within 24 hours
);

-- Add comment
COMMENT ON TABLE ratings IS 'Stores ratings between DJs and Brands. DJs rate brands, brands rate DJs.';
COMMENT ON COLUMN ratings.rating_type IS 'dj_rating: Brand rating the DJ. brand_rating: DJ rating the Brand.';
COMMENT ON COLUMN ratings.stars IS 'Rating from 1 to 5 stars';
