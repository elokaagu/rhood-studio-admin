-- ============================================
-- POPULATE CREDITS FROM EXISTING ACTIVITIES
-- This script awards credits based on existing bookings and applications
-- More realistic than random credits
-- ============================================

DO $$
DECLARE
  booking_record RECORD;
  application_record RECORD;
  credits_awarded INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting credits population from existing activities...';
  RAISE NOTICE '';
  
  -- Award 50 credits for each accepted booking request
  RAISE NOTICE 'Processing accepted booking requests...';
  FOR booking_record IN
    SELECT 
      br.id,
      br.dj_id,
      br.event_title,
      br.status,
      br.created_at,
      up.dj_name,
      up.email
    FROM booking_requests br
    JOIN user_profiles up ON br.dj_id = up.id
    WHERE br.status = 'accepted'
      AND NOT EXISTS (
        -- Don't create duplicate transactions
        SELECT 1 FROM credit_transactions ct
        WHERE ct.reference_id = br.id
        AND ct.reference_type = 'booking_request'
        AND ct.transaction_type = 'gig_completed'
      )
  LOOP
    BEGIN
      PERFORM award_credits(
        booking_record.dj_id,
        50,
        'gig_completed',
        'Completed gig: ' || COALESCE(booking_record.event_title, 'Booking'),
        booking_record.id,
        'booking_request'
      );
      
      credits_awarded := credits_awarded + 1;
      RAISE NOTICE 'Awarded 50 credits for booking: % (DJ: %)', 
        booking_record.event_title, 
        COALESCE(booking_record.dj_name, booking_record.email);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to award credits for booking %: %', booking_record.id, SQLERRM;
    END;
  END LOOP;
  
  -- Award 50 credits for each approved application
  RAISE NOTICE '';
  RAISE NOTICE 'Processing approved applications...';
  FOR application_record IN
    SELECT 
      a.id,
      a.user_id,
      a.opportunity_id,
      a.status,
      a.created_at,
      o.title as opportunity_title,
      up.dj_name,
      up.email
    FROM applications a
    JOIN user_profiles up ON a.user_id = up.id
    LEFT JOIN opportunities o ON a.opportunity_id = o.id
    WHERE a.status = 'approved'
      AND NOT EXISTS (
        -- Don't create duplicate transactions
        SELECT 1 FROM credit_transactions ct
        WHERE ct.reference_id = a.id
        AND ct.reference_type = 'application'
        AND ct.transaction_type = 'gig_completed'
      )
  LOOP
    BEGIN
      PERFORM award_credits(
        application_record.user_id,
        50,
        'gig_completed',
        'Gig approved: ' || COALESCE(application_record.opportunity_title, 'Application'),
        application_record.id,
        'application'
      );
      
      credits_awarded := credits_awarded + 1;
      RAISE NOTICE 'Awarded 50 credits for application: % (DJ: %)', 
        COALESCE(application_record.opportunity_title, 'Application'), 
        COALESCE(application_record.dj_name, application_record.email);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to award credits for application %: %', application_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Credits population from activities complete!';
  RAISE NOTICE 'Awarded credits for % activities', credits_awarded;
  RAISE NOTICE '========================================';
END $$;

-- Show summary of credits distribution
SELECT 
  'Total Users with Credits' as metric,
  COUNT(DISTINCT up.id)::TEXT as value
FROM user_profiles up
WHERE (up.role IS NULL OR up.role != 'admin')
  AND COALESCE(up.credits, 0) > 0

UNION ALL

SELECT 
  'Total Credits Awarded' as metric,
  COALESCE(SUM(up.credits), 0)::TEXT as value
FROM user_profiles up
WHERE (up.role IS NULL OR up.role != 'admin')

UNION ALL

SELECT 
  'Total Transactions Created' as metric,
  COUNT(*)::TEXT as value
FROM credit_transactions
WHERE transaction_type = 'gig_completed'

UNION ALL

SELECT 
  'Average Credits per User' as metric,
  ROUND(AVG(up.credits), 2)::TEXT as value
FROM user_profiles up
WHERE (up.role IS NULL OR up.role != 'admin')
  AND COALESCE(up.credits, 0) > 0;

-- Show top 10 users by credits
SELECT 
  ROW_NUMBER() OVER (ORDER BY up.credits DESC) as rank,
  COALESCE(up.dj_name, up.brand_name, up.first_name || ' ' || up.last_name, up.email) as name,
  up.credits,
  COUNT(ct.id) as transactions
FROM user_profiles up
LEFT JOIN credit_transactions ct ON ct.user_id = up.id
WHERE (up.role IS NULL OR up.role != 'admin')
  AND COALESCE(up.credits, 0) > 0
GROUP BY up.id, up.dj_name, up.brand_name, up.first_name, up.last_name, up.email, up.credits
ORDER BY up.credits DESC
LIMIT 10;

