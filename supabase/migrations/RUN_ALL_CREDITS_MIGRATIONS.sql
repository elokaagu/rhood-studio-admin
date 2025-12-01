-- ============================================
-- COMBINED CREDITS SYSTEM MIGRATIONS
-- Run this in Supabase SQL Editor to set up the entire credits system
-- ============================================

-- PREREQUISITE: Create user_profiles table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dj_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  genres TEXT[],
  bio TEXT,
  instagram TEXT,
  soundcloud TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_dj_name ON user_profiles(dj_name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_city ON user_profiles(city);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON user_profiles(created_at);

-- Enable Row Level Security for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for user_profiles (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Admins can view all user profiles'
  ) THEN
    CREATE POLICY "Admins can view all user profiles" ON user_profiles
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Admins can insert user profiles'
  ) THEN
    CREATE POLICY "Admins can insert user profiles" ON user_profiles
      FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Admins can update user profiles'
  ) THEN
    CREATE POLICY "Admins can update user profiles" ON user_profiles
      FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Admins can delete user profiles'
  ) THEN
    CREATE POLICY "Admins can delete user profiles" ON user_profiles
      FOR DELETE USING (true);
  END IF;
END $$;

-- Ensure updated_at trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at trigger for user_profiles if it doesn't exist
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add role and brand_name columns if they don't exist (for brand accounts)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'brand'));

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS brand_name TEXT;

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_brand_name ON user_profiles(brand_name);

UPDATE user_profiles SET role = 'admin' WHERE role IS NULL;

-- PREREQUISITE: Create opportunities table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  payment DECIMAL(10,2),
  genre TEXT,
  skill_level TEXT,
  organizer_name TEXT,
  organizer_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  event_end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- Add created_by column if it doesn't exist (in case table already exists)
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

-- Create indexes for opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_is_active ON opportunities(is_active);
CREATE INDEX IF NOT EXISTS idx_opportunities_genre ON opportunities(genre);
CREATE INDEX IF NOT EXISTS idx_opportunities_event_date ON opportunities(event_date);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON opportunities(created_at);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by ON opportunities(created_by);

-- Enable Row Level Security for opportunities
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for opportunities
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'opportunities' 
    AND policyname = 'Admins can view all opportunities'
  ) THEN
    CREATE POLICY "Admins can view all opportunities" ON opportunities
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'opportunities' 
    AND policyname = 'Admins can insert opportunities'
  ) THEN
    CREATE POLICY "Admins can insert opportunities" ON opportunities
      FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'opportunities' 
    AND policyname = 'Admins can update opportunities'
  ) THEN
    CREATE POLICY "Admins can update opportunities" ON opportunities
      FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'opportunities' 
    AND policyname = 'Admins can delete opportunities'
  ) THEN
    CREATE POLICY "Admins can delete opportunities" ON opportunities
      FOR DELETE USING (true);
  END IF;
END $$;

-- Create updated_at trigger for opportunities
DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at 
  BEFORE UPDATE ON opportunities 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- PREREQUISITE: Create applications table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for applications
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);

-- Enable Row Level Security for applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'applications' 
    AND policyname = 'Admins can view all applications'
  ) THEN
    CREATE POLICY "Admins can view all applications" ON applications
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'applications' 
    AND policyname = 'Admins can insert applications'
  ) THEN
    CREATE POLICY "Admins can insert applications" ON applications
      FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'applications' 
    AND policyname = 'Admins can update applications'
  ) THEN
    CREATE POLICY "Admins can update applications" ON applications
      FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'applications' 
    AND policyname = 'Admins can delete applications'
  ) THEN
    CREATE POLICY "Admins can delete applications" ON applications
      FOR DELETE USING (true);
  END IF;
END $$;

-- Create updated_at trigger for applications
DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at 
  BEFORE UPDATE ON applications 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- PREREQUISITE: Create booking_requests table if it doesn't exist
-- ============================================
CREATE TABLE IF NOT EXISTS public.booking_requests (
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

-- Create indexes for booking_requests
CREATE INDEX IF NOT EXISTS idx_booking_requests_brand_id ON booking_requests(brand_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_dj_id ON booking_requests(dj_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_status ON booking_requests(status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_event_date ON booking_requests(event_date);
CREATE INDEX IF NOT EXISTS idx_booking_requests_created_at ON booking_requests(created_at);

-- Enable Row Level Security for booking_requests
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger for booking_requests
DROP TRIGGER IF EXISTS update_booking_requests_updated_at ON booking_requests;
CREATE TRIGGER update_booking_requests_updated_at 
  BEFORE UPDATE ON booking_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Migration 1: Create Credits System (20250114000000_create_credits_system.sql)
-- ============================================

-- STEP 1: Add credits field to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_credits ON user_profiles(credits);

-- STEP 2: Create credit_transactions table
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
DROP POLICY IF EXISTS "Users can view their own credit transactions" ON credit_transactions;
CREATE POLICY "Users can view their own credit transactions"
ON credit_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all credit transactions
DROP POLICY IF EXISTS "Admins can view all credit transactions" ON credit_transactions;
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
DROP POLICY IF EXISTS "System can insert credit transactions" ON credit_transactions;
CREATE POLICY "System can insert credit transactions"
ON credit_transactions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- STEP 3: Create boosts table
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
DROP POLICY IF EXISTS "Users can view their own boosts" ON opportunity_boosts;
CREATE POLICY "Users can view their own boosts"
ON opportunity_boosts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Anyone can view active boosts for opportunities
DROP POLICY IF EXISTS "Anyone can view active opportunity boosts" ON opportunity_boosts;
CREATE POLICY "Anyone can view active opportunity boosts"
ON opportunity_boosts
FOR SELECT
TO authenticated
USING (is_active = true AND boost_expires_at > NOW());

-- Users can create boosts (if they have enough credits)
DROP POLICY IF EXISTS "Users can create boosts" ON opportunity_boosts;
CREATE POLICY "Users can create boosts"
ON opportunity_boosts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Brands and admins can view all boosts for their opportunities
-- Note: Using organizer_id as fallback in case created_by is not populated
DROP POLICY IF EXISTS "Brands can view boosts for their opportunities" ON opportunity_boosts;
CREATE POLICY "Brands can view boosts for their opportunities"
ON opportunity_boosts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM opportunities o
    JOIN user_profiles up ON COALESCE(o.created_by, o.organizer_id) = up.id
    WHERE o.id = opportunity_boosts.opportunity_id
    AND up.id = auth.uid()
    AND up.role IN ('brand', 'admin')
  )
);

-- STEP 4: Create function to award credits
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

-- STEP 5: Create function to spend credits
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

-- STEP 6: Create triggers to award credits
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

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS booking_request_accepted_credits ON booking_requests;

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
    -- Use explicit error handling to avoid issues
    BEGIN
      PERFORM award_credits(
        NEW.user_id,
        50,
        'gig_completed',
        'Gig approved: Application ID ' || NEW.id::TEXT,
        NEW.id,
        'application'
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but don't fail the update
        RAISE WARNING 'Error awarding credits: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS application_approved_credits ON applications;

CREATE TRIGGER application_approved_credits
AFTER UPDATE ON applications
FOR EACH ROW
WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
EXECUTE FUNCTION handle_application_approved();

-- STEP 7: Create function to get leaderboard
-- Drop the function if it exists with wrong signature
DROP FUNCTION IF EXISTS get_credits_leaderboard(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_credits_leaderboard(p_limit INTEGER, p_year INTEGER);
DROP FUNCTION IF EXISTS get_credits_leaderboard(p_year INTEGER, p_limit INTEGER);

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
        SUM(ct.amount)::INTEGER as total
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
      COALESCE(yc.total, COALESCE(up.credits, 0))::INTEGER as total_credits,
      ROW_NUMBER() OVER (ORDER BY COALESCE(yc.total, COALESCE(up.credits, 0)) DESC) as rank_position
    FROM user_profiles up
    LEFT JOIN yearly_credits yc ON up.id = yc.user_id
    WHERE (up.role IS NULL OR up.role != 'admin') -- Exclude admins from leaderboard
      AND (yc.total IS NOT NULL OR COALESCE(up.credits, 0) > 0) -- Only show users with credits
    ORDER BY COALESCE(yc.total, COALESCE(up.credits, 0)) DESC
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
      COALESCE(up.credits, 0)::INTEGER as total_credits,
      ROW_NUMBER() OVER (ORDER BY COALESCE(up.credits, 0) DESC) as rank_position
    FROM user_profiles up
    WHERE (up.role IS NULL OR up.role != 'admin') -- Exclude admins
      AND COALESCE(up.credits, 0) > 0
    ORDER BY COALESCE(up.credits, 0) DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_credits_leaderboard(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_credits_leaderboard(INTEGER, INTEGER) TO anon;

-- STEP 8: Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers
DROP TRIGGER IF EXISTS update_credit_transactions_updated_at ON credit_transactions;
CREATE TRIGGER update_credit_transactions_updated_at 
  BEFORE UPDATE ON credit_transactions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_opportunity_boosts_updated_at ON opportunity_boosts;
CREATE TRIGGER update_opportunity_boosts_updated_at 
  BEFORE UPDATE ON opportunity_boosts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Migration 2: Fix venue field error (20250116000000_fix_venue_field_error.sql)
-- ============================================

-- Drop any views that might reference venue field
DO $$
DECLARE
  view_record RECORD;
  view_def TEXT;
BEGIN
  -- Find and drop views that might reference venue
  FOR view_record IN 
    SELECT 
      v.table_schema,
      v.table_name,
      v.view_definition as def
    FROM information_schema.views v
    WHERE v.table_schema = 'public'
    AND (
      v.table_name LIKE '%opportunity%' 
      OR v.view_definition ILIKE '%venue%'
    )
  LOOP
    BEGIN
      -- Check if view definition contains venue
      view_def := view_record.def;
      IF view_def ILIKE '%venue%' THEN
        RAISE NOTICE 'Dropping view % that references venue', view_record.table_name;
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_record.table_schema, view_record.table_name);
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop view %: %', view_record.table_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- Migration complete!
-- You should now be able to access the Credit Transactions page without errors.

