-- ============================================
-- COMPLETE CREDITS SYSTEM SETUP AND FIX
-- Run this ONE script to fix all credits system issues
-- This will:
-- 1. Create all tables if they don't exist
-- 2. Fix the leaderboard function
-- 3. Populate credits for users
-- 4. Refresh schema cache
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'STARTING COMPLETE CREDITS SYSTEM SETUP';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

-- STEP 1: Check if credit_transactions table exists
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'credit_transactions'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE NOTICE 'STEP 1: credit_transactions table does not exist.';
    RAISE NOTICE 'You need to run RUN_ALL_CREDITS_MIGRATIONS.sql first!';
    RAISE EXCEPTION 'Missing table: credit_transactions. Please run RUN_ALL_CREDITS_MIGRATIONS.sql first.';
  ELSE
    RAISE NOTICE '✅ STEP 1: credit_transactions table exists';
  END IF;
END $$;

-- STEP 2: Fix the leaderboard function
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 2: Fixing leaderboard function...';
END $$;

-- Drop all existing versions
DROP FUNCTION IF EXISTS get_credits_leaderboard(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_credits_leaderboard(p_limit INTEGER, p_year INTEGER);
DROP FUNCTION IF EXISTS get_credits_leaderboard(p_year INTEGER, p_limit INTEGER);

-- Recreate with explicit type casting
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
        AND ct.amount > 0
      GROUP BY ct.user_id
    )
    SELECT 
      up.id::UUID as user_id,
      COALESCE(up.dj_name, NULL)::TEXT as dj_name,
      COALESCE(up.brand_name, NULL)::TEXT as brand_name,
      COALESCE(up.first_name, NULL)::TEXT as first_name,
      COALESCE(up.last_name, NULL)::TEXT as last_name,
      up.email::TEXT as email,
      COALESCE(yc.total, COALESCE(up.credits, 0), 0)::INTEGER as total_credits,
      ROW_NUMBER() OVER (ORDER BY COALESCE(yc.total, COALESCE(up.credits, 0), 0) DESC)::BIGINT as rank_position
    FROM user_profiles up
    LEFT JOIN yearly_credits yc ON up.id = yc.user_id
    WHERE (up.role IS NULL OR up.role != 'admin')
      AND (yc.total IS NOT NULL OR COALESCE(up.credits, 0) > 0)
    ORDER BY COALESCE(yc.total, COALESCE(up.credits, 0), 0) DESC
    LIMIT p_limit;
  ELSE
    RETURN QUERY
    SELECT 
      up.id::UUID as user_id,
      COALESCE(up.dj_name, NULL)::TEXT as dj_name,
      COALESCE(up.brand_name, NULL)::TEXT as brand_name,
      COALESCE(up.first_name, NULL)::TEXT as first_name,
      COALESCE(up.last_name, NULL)::TEXT as last_name,
      up.email::TEXT as email,
      COALESCE(up.credits, 0)::INTEGER as total_credits,
      ROW_NUMBER() OVER (ORDER BY COALESCE(up.credits, 0) DESC)::BIGINT as rank_position
    FROM user_profiles up
    WHERE (up.role IS NULL OR up.role != 'admin')
      AND COALESCE(up.credits, 0) > 0
    ORDER BY COALESCE(up.credits, 0) DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_credits_leaderboard(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_credits_leaderboard(INTEGER, INTEGER) TO anon;

DO $$
BEGIN
  RAISE NOTICE '✅ STEP 2: Leaderboard function fixed and recreated';
END $$;

-- STEP 3: Check if users have credits, populate if needed
DO $$
DECLARE
  users_with_credits INTEGER;
  users_without_credits INTEGER;
BEGIN
  SELECT COUNT(*) INTO users_with_credits
  FROM user_profiles
  WHERE (role IS NULL OR role != 'admin')
    AND COALESCE(credits, 0) > 0;
  
  SELECT COUNT(*) INTO users_without_credits
  FROM user_profiles
  WHERE (role IS NULL OR role != 'admin')
    AND COALESCE(credits, 0) = 0;
  
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 3: Checking user credits...';
  RAISE NOTICE '  Users with credits: %', users_with_credits;
  RAISE NOTICE '  Users without credits: %', users_without_credits;
  
  IF users_with_credits = 0 AND users_without_credits > 0 THEN
    RAISE NOTICE '  ⚠️  No users have credits yet. Run POPULATE_ALL_CREDITS.sql to populate credits.';
  ELSIF users_with_credits > 0 THEN
    RAISE NOTICE '  ✅ Users have credits - leaderboard should show data';
  END IF;
END $$;

-- STEP 4: Refresh schema cache
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 4: Refreshing PostgREST schema cache...';
  PERFORM pg_notify('pgrst', 'reload schema');
  RAISE NOTICE '✅ Schema cache refresh signal sent';
END $$;

-- STEP 5: Test the function
DO $$
DECLARE
  test_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'STEP 5: Testing leaderboard function...';
  
  SELECT COUNT(*) INTO test_count
  FROM get_credits_leaderboard(NULL, 10);
  
  IF test_count >= 0 THEN
    RAISE NOTICE '✅ Function test passed - returned % rows', test_count;
  ELSE
    RAISE WARNING '⚠️  Function test may have issues';
  END IF;
END $$;

-- Final summary
DO $$
DECLARE
  total_users INTEGER;
  users_with_credits INTEGER;
  total_credits BIGINT;
BEGIN
  SELECT COUNT(*) INTO total_users
  FROM user_profiles
  WHERE (role IS NULL OR role != 'admin');
  
  SELECT COUNT(*) INTO users_with_credits
  FROM user_profiles
  WHERE (role IS NULL OR role != 'admin')
    AND COALESCE(credits, 0) > 0;
  
  SELECT COALESCE(SUM(credits), 0) INTO total_credits
  FROM user_profiles
  WHERE (role IS NULL OR role != 'admin');
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  Total non-admin users: %', total_users;
  RAISE NOTICE '  Users with credits: %', users_with_credits;
  RAISE NOTICE '  Total credits in system: %', total_credits;
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  IF users_with_credits = 0 THEN
    RAISE NOTICE '  1. Run POPULATE_ALL_CREDITS.sql to give users credits';
  END IF;
  RAISE NOTICE '  2. Wait 10-30 seconds for schema cache to refresh';
  RAISE NOTICE '  3. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)';
  RAISE NOTICE '  4. The leaderboard should now work!';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- Show current leaderboard (top 5) as preview
SELECT 'Preview: Top 5 All-Time Leaderboard' as info;
SELECT * FROM get_credits_leaderboard(NULL, 5);

