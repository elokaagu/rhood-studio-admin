-- Create Credits System
-- This migration creates the credits system for gamified DJ engagement

-- ============================================
-- STEP 1: Add credits field to user_profiles
-- ============================================
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_credits ON user_profiles(credits);

-- ============================================
-- STEP 2: Create credit_transactions table
-- ============================================
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Can be positive (earned) or negative (spent)
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'gig_completed',
    'rating_received',
    'boost_used',
    'manual_adjustment',
    'endorsement',
    'streak_bonus'
  )),
  description TEXT,
  reference_id UUID, -- Reference to the related entity (application_id, booking_request_id, etc.)
  reference_type TEXT, -- 'application', 'booking_request', 'rating', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_reference ON credit_transactions(reference_id, reference_type);

-- Enable Row Level Security
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own credit transactions
CREATE POLICY "Users can view their own credit transactions"
ON credit_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all credit transactions
CREATE POLICY "Admins can view all credit transactions"
ON credit_transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.role = 'admin'
  )
);

-- System can insert credit transactions (via triggers/functions)
CREATE POLICY "System can insert credit transactions"
ON credit_transactions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- STEP 3: Create boosts table
-- ============================================
CREATE TABLE IF NOT EXISTS public.opportunity_boosts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  boost_cost INTEGER DEFAULT 100 NOT NULL, -- Credits spent on this boost
  boost_expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- When boost expires (e.g., 24 hours)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_opportunity_boosts_opportunity_id ON opportunity_boosts(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_boosts_user_id ON opportunity_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_boosts_active ON opportunity_boosts(is_active, boost_expires_at);
CREATE INDEX IF NOT EXISTS idx_opportunity_boosts_created_at ON opportunity_boosts(created_at);

-- Enable Row Level Security
ALTER TABLE opportunity_boosts ENABLE ROW LEVEL SECURITY;

-- Users can view their own boosts
CREATE POLICY "Users can view their own boosts"
ON opportunity_boosts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Anyone can view active boosts for opportunities
CREATE POLICY "Anyone can view active opportunity boosts"
ON opportunity_boosts
FOR SELECT
TO authenticated
USING (is_active = true AND boost_expires_at > NOW());

-- Users can create boosts (if they have enough credits)
CREATE POLICY "Users can create boosts"
ON opportunity_boosts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================
-- STEP 4: Create function to award credits
-- ============================================
CREATE OR REPLACE FUNCTION award_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO v_current_credits
  FROM user_profiles
  WHERE id = p_user_id;

  -- Insert credit transaction
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    reference_id,
    reference_type
  )
  VALUES (
    p_user_id,
    p_amount,
    p_transaction_type,
    p_description,
    p_reference_id,
    p_reference_type
  )
  RETURNING id INTO v_transaction_id;

  -- Update user credits
  UPDATE user_profiles
  SET credits = COALESCE(v_current_credits, 0) + p_amount
  WHERE id = p_user_id;

  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: Create function to spend credits
-- ============================================
CREATE OR REPLACE FUNCTION spend_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_transaction_type TEXT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_credits INTEGER;
BEGIN
  -- Get current credits
  SELECT credits INTO v_current_credits
  FROM user_profiles
  WHERE id = p_user_id;

  -- Check if user has enough credits
  IF COALESCE(v_current_credits, 0) < p_amount THEN
    RETURN FALSE;
  END IF;

  -- Insert credit transaction (negative amount)
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    reference_id,
    reference_type
  )
  VALUES (
    p_user_id,
    -p_amount,
    p_transaction_type,
    p_description,
    p_reference_id,
    p_reference_type
  );

  -- Update user credits
  UPDATE user_profiles
  SET credits = v_current_credits - p_amount
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 6: Create triggers to award credits
-- ============================================

-- Trigger: Award 50 credits when booking request is accepted
CREATE OR REPLACE FUNCTION handle_booking_request_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- When a booking request changes from pending/accepted to accepted
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Award 50 credits for completing a gig
    PERFORM award_credits(
      NEW.dj_id,
      50,
      'gig_completed',
      'Completed gig: ' || COALESCE(NEW.event_title, 'Booking'),
      NEW.id,
      'booking_request'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_request_accepted_credits
AFTER UPDATE ON booking_requests
FOR EACH ROW
WHEN (NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted'))
EXECUTE FUNCTION handle_booking_request_accepted();

-- Trigger: Award 50 credits when application is approved
CREATE OR REPLACE FUNCTION handle_application_approved()
RETURNS TRIGGER AS $$
BEGIN
  -- When an application changes to approved status
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Award 50 credits for completing a gig
    PERFORM award_credits(
      NEW.user_id,
      50,
      'gig_completed',
      'Gig approved: Application ID ' || NEW.id::TEXT,
      NEW.id,
      'application'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER application_approved_credits
AFTER UPDATE ON applications
FOR EACH ROW
WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
EXECUTE FUNCTION handle_application_approved();

-- Note: Rating trigger will need to be added when rating system is implemented
-- For now, this can be handled via an API endpoint when ratings are submitted

-- ============================================
-- STEP 7: Create function to get leaderboard
-- ============================================
CREATE OR REPLACE FUNCTION get_credits_leaderboard(
  p_year INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  user_id UUID,
  dj_name TEXT,
  brand_name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  total_credits INTEGER,
  rank_position BIGINT
) AS $$
DECLARE
  v_start_date TIMESTAMP WITH TIME ZONE;
  v_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- If year is specified, filter by year
  IF p_year IS NOT NULL THEN
    v_start_date := make_date(p_year, 1, 1);
    v_end_date := make_date(p_year, 12, 31) + interval '1 day' - interval '1 second';
    
    RETURN QUERY
    WITH yearly_credits AS (
      SELECT 
        ct.user_id,
        SUM(ct.amount) as total
      FROM credit_transactions ct
      WHERE ct.created_at >= v_start_date
        AND ct.created_at <= v_end_date
        AND ct.amount > 0 -- Only count earned credits, not spent
      GROUP BY ct.user_id
    )
    SELECT 
      up.id as user_id,
      up.dj_name,
      up.brand_name,
      up.first_name,
      up.last_name,
      up.email,
      COALESCE(yc.total, 0)::INTEGER as total_credits,
      ROW_NUMBER() OVER (ORDER BY COALESCE(yc.total, 0) DESC) as rank_position
    FROM user_profiles up
    LEFT JOIN yearly_credits yc ON up.id = yc.user_id
    WHERE up.role != 'admin' -- Exclude admins from leaderboard
      AND (yc.total IS NOT NULL OR up.credits > 0) -- Only show users with credits
    ORDER BY COALESCE(yc.total, 0) DESC, up.credits DESC
    LIMIT p_limit;
  ELSE
    -- All-time leaderboard
    RETURN QUERY
    SELECT 
      up.id as user_id,
      up.dj_name,
      up.brand_name,
      up.first_name,
      up.last_name,
      up.email,
      up.credits as total_credits,
      ROW_NUMBER() OVER (ORDER BY up.credits DESC) as rank_position
    FROM user_profiles up
    WHERE up.role != 'admin' -- Exclude admins
      AND up.credits > 0
    ORDER BY up.credits DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 8: Ensure update_updated_at_column function exists
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers
CREATE TRIGGER update_credit_transactions_updated_at 
  BEFORE UPDATE ON credit_transactions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunity_boosts_updated_at 
  BEFORE UPDATE ON opportunity_boosts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 9: Add RLS policies for opportunity_boosts
-- ============================================
-- Brands and admins can view all boosts for their opportunities
CREATE POLICY "Brands can view boosts for their opportunities"
ON opportunity_boosts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM opportunities o
    JOIN user_profiles up ON o.created_by = up.id
    WHERE o.id = opportunity_boosts.opportunity_id
    AND up.id = auth.uid()
    AND up.role IN ('brand', 'admin')
  )
);

