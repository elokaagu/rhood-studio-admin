-- ============================================
-- POPULATE INITIAL CREDITS FOR EXISTING USERS
-- This script gives sample credits to existing users based on their activity
-- Run this after running RUN_ALL_CREDITS_MIGRATIONS.sql
-- ============================================

-- First, let's check if we have any users
DO $$
DECLARE
  user_count INTEGER;
  populated_count INTEGER := 0;
  user_record RECORD;
  credits_to_award INTEGER;
  transaction_id UUID;
BEGIN
  -- Count non-admin users
  SELECT COUNT(*) INTO user_count
  FROM user_profiles
  WHERE role IS NULL OR role != 'admin';
  
  RAISE NOTICE 'Found % non-admin users to populate credits for', user_count;
  
  -- Give each user a random amount of credits based on some sample activities
  FOR user_record IN 
    SELECT id, dj_name, brand_name, first_name, last_name, email, credits
    FROM user_profiles
    WHERE (role IS NULL OR role != 'admin')
  LOOP
    -- Skip if user already has credits (to avoid duplicates)
    IF COALESCE(user_record.credits, 0) > 0 THEN
      RAISE NOTICE 'User % already has credits, skipping', COALESCE(user_record.dj_name, user_record.email);
      CONTINUE;
    END IF;
    
    -- Award random credits between 50-500 based on "activities"
    -- This simulates completed gigs and ratings
    credits_to_award := 50 + (random() * 450)::INTEGER;
    
    -- Award credits using the award_credits function
    BEGIN
      -- Award credits for "sample completed gigs"
      PERFORM award_credits(
        user_record.id,
        credits_to_award,
        'gig_completed',
        'Initial credits populated - sample completed gigs',
        NULL,
        NULL
      );
      
      populated_count := populated_count + 1;
      RAISE NOTICE 'Awarded % credits to user: %', credits_to_award, COALESCE(user_record.dj_name, user_record.email);
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to award credits to user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Credits population complete!';
  RAISE NOTICE 'Populated credits for % users', populated_count;
  RAISE NOTICE '========================================';
END $$;

-- Verify the results
SELECT 
  up.dj_name,
  up.brand_name,
  up.email,
  up.credits,
  COUNT(ct.id) as transaction_count
FROM user_profiles up
LEFT JOIN credit_transactions ct ON ct.user_id = up.id
WHERE (up.role IS NULL OR up.role != 'admin')
GROUP BY up.id, up.dj_name, up.brand_name, up.email, up.credits
ORDER BY up.credits DESC NULLS LAST
LIMIT 20;

