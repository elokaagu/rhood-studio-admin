-- Create booking_requests table for brand-to-DJ booking requests
CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  dj_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  event_title TEXT NOT NULL,
  event_description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  event_end_time TIMESTAMP WITH TIME ZONE,
  location TEXT NOT NULL,
  location_place_id TEXT,
  payment_amount DECIMAL(10,2),
  payment_currency TEXT DEFAULT 'GBP',
  genre TEXT,
  additional_requirements TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  dj_response_at TIMESTAMP WITH TIME ZONE,
  dj_response_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_booking_requests_brand_id ON booking_requests(brand_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_dj_id ON booking_requests(dj_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_event_date ON booking_requests(event_date);
CREATE INDEX IF NOT EXISTS idx_booking_requests_created_at ON booking_requests(created_at);

-- Enable Row Level Security
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

-- Brands can view their own booking requests
CREATE POLICY "Brands can view their own booking requests"
ON booking_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = booking_requests.brand_id
    AND user_profiles.id = auth.uid()
    AND user_profiles.role = 'brand'
  )
);

-- Brands can create booking requests
CREATE POLICY "Brands can create booking requests"
ON booking_requests
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'brand'
  )
  AND brand_id = auth.uid()
);

-- Brands can update their own booking requests (only if pending)
CREATE POLICY "Brands can update pending booking requests"
ON booking_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = booking_requests.brand_id
    AND user_profiles.id = auth.uid()
    AND user_profiles.role = 'brand'
  )
  AND status = 'pending'
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = booking_requests.brand_id
    AND user_profiles.id = auth.uid()
    AND user_profiles.role = 'brand'
  )
  AND status = 'pending'
);

-- DJs can view booking requests sent to them
CREATE POLICY "DJs can view their booking requests"
ON booking_requests
FOR SELECT
TO authenticated
USING (
  dj_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- DJs can update booking requests sent to them (accept/decline)
CREATE POLICY "DJs can respond to booking requests"
ON booking_requests
FOR UPDATE
TO authenticated
USING (
  dj_id = auth.uid()
  AND status = 'pending'
)
WITH CHECK (
  dj_id = auth.uid()
  AND status IN ('accepted', 'declined')
);

-- Admins can view all booking requests
CREATE POLICY "Admins can view all booking requests"
ON booking_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_booking_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_booking_requests_updated_at 
  BEFORE UPDATE ON booking_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_booking_requests_updated_at();

