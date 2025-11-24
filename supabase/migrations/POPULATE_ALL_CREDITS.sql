-- ============================================
-- POPULATE ALL CREDITS (ACTIVITIES + INITIAL)
-- This script populates credits for all users:
-- 1. First from existing accepted bookings and approved applications
-- 2. Then gives sample credits to users who don't have any yet
-- Run this after RUN_ALL_CREDITS_MIGRATIONS.sql
-- ============================================

DO $$
DECLARE
  total_credits_awarded INTEGER := 0;
  user_record RECORD;
  credits_to_award INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'POPULATING CREDITS FOR ALL USERS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  
  -- STEP 1: Award credits for existing accepted booking requests
  RAISE NOTICE 'STEP 1: Processing accepted booking requests...';
  FOR user_record IN
    SELECT DISTINCT
      br.dj_id as user_id,
      COUNT(*) as booking_count,
      MAX(up.dj_name) as dj_name,
      MAX(up.email) as email
    FROM booking_requests br
    JOIN user_profiles up ON br.dj_id = up.id
    WHERE br.status = 'accepted'
      AND NOT EXISTS (
        SELECT 1 FROM credit_transactions ct
        WHERE ct.reference_id = br.id
        AND ct.reference_type = 'booking_request'
      )
    GROUP BY br.dj_id
  LOOP
    BEGIN
      PERFORM award_credits(
        user_record.user_id,
        50 * user_record.booking_count, -- 50 credits per booking
        'gig_completed',
        format('Completed %s gig(s) from booking requests', user_record.booking_count),
        NULL,
        'booking_request'
      );
      
      total_credits_awarded := total_credits_awarded + 1;
      RAISE NOTICE '  ✓ Awarded % credits for % booking(s) - %', 
        50 * user_record.booking_count,
        user_record.booking_count,
        COALESCE(user_record.dj_name, user_record.email);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '  ✗ Failed to award credits for user %: %', user_record.user_id, SQLERRM;
    END;
  END LOOP;
  
  -- STEP 2: Award credits for existing approved applications
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 2: Processing approved applications...';
  FOR user_record IN
    SELECT DISTINCT
      a.user_id,
      COUNT(*) as application_count,
      MAX(up.dj_name) as dj_name,
      MAX(up.email) as email
    FROM applications a
    JOIN user_profiles up ON a.user_id = up.id
    WHERE a.status = 'approved'
      AND NOT EXISTS (
        SELECT 1 FROM credit_transactions ct
        WHERE ct.reference_id = a.id
        AND ct.reference_type = 'application'
      )
    GROUP BY a.user_id
  LOOP
    BEGIN
      PERFORM award_credits(
        user_record.user_id,
        50 * user_record.application_count, -- 50 credits per approved application
        'gig_completed',
        format('Approved for %s gig(s) via applications', user_record.application_count),
        NULL,
        'application'
      );
      
      total_credits_awarded := total_credits_awarded + 1;
      RAISE NOTICE '  ✓ Awarded % credits for % application(s) - %', 
        50 * user_record.application_count,
        user_record.application_count,
        COALESCE(user_record.dj_name, user_record.email);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '  ✗ Failed to award credits for user %: %', user_record.user_id, SQLERRM;
    END;
  END LOOP;
  
  -- STEP 3: Give sample credits to users who don't have any yet
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 3: Giving initial credits to users without any...';
  FOR user_record IN
    SELECT 
      id,
      dj_name,
      brand_name,
      first_name,
      last_name,
      email,
      COALESCE(credits, 0) as current_credits
    FROM user_profiles
    WHERE (role IS NULL OR role != 'admin')
      AND COALESCE(credits, 0) = 0
  LOOP
    -- Give random credits between 100-300 to simulate some activity
    credits_to_award := 100 + (random() * 200)::INTEGER;
    
    BEGIN
      PERFORM award_credits(
        user_record.id,
        credits_to_award,
        'gig_completed',
        'Initial credits - welcome bonus',
        NULL,
        NULL
      );
      
      total_credits_awarded := total_credits_awarded + 1;
      RAISE NOTICE '  ✓ Awarded % initial credits - %', 
        credits_to_award,
        COALESCE(user_record.dj_name, user_record.brand_name, user_record.email);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING '  ✗ Failed to award initial credits for user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Credits population complete!';
  RAISE NOTICE 'Processed % users', total_credits_awarded;
  RAISE NOTICE '========================================';
END $$;

-- Show summary statistics
SELECT 
  'Summary' as section,
  '' as detail
UNION ALL
SELECT 
  'Total Users with Credits' as section,
  COUNT(*)::TEXT as detail
FROM user_profiles
WHERE (role IS NULL OR role != 'admin')
  AND COALESCE(credits, 0) > 0
UNION ALL
SELECT 
  'Total Credits in System' as section,
  COALESCE(SUM(credits), 0)::TEXT as detail
FROM user_profiles
WHERE (role IS NULL OR role != 'admin')
UNION ALL
SELECT 
  'Total Credit Transactions' as section,
  COUNT(*)::TEXT as detail
FROM credit_transactions;

-- Show top 15 leaderboard
SELECT 
  ROW_NUMBER() OVER (ORDER BY up.credits DESC) as rank,
  COALESCE(
    up.dj_name, 
    up.brand_name, 
    up.first_name || ' ' || up.last_name, 
    up.email
  ) as name,
  up.credits,
  COUNT(ct.id) as transaction_count
FROM user_profiles up
LEFT JOIN credit_transactions ct ON ct.user_id = up.id
WHERE (up.role IS NULL OR up.role != 'admin')
  AND COALESCE(up.credits, 0) > 0
GROUP BY up.id, up.dj_name, up.brand_name, up.first_name, up.last_name, up.email, up.credits
ORDER BY up.credits DESC
LIMIT 15;

