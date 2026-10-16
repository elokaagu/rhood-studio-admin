-- Ensure ratings exists and authenticated users can read DJ averages.
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  rating_type TEXT NOT NULL CHECK (rating_type IN ('dj_rating', 'brand_rating')),
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(application_id, rating_type)
);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read DJ ratings" ON ratings;
CREATE POLICY "Anyone authenticated can read DJ ratings"
ON ratings FOR SELECT TO authenticated
USING (rating_type = 'dj_rating');
