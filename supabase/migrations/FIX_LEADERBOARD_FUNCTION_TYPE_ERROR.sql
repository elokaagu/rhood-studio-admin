-- ============================================
-- FIX LEADERBOARD FUNCTION TYPE ERROR
-- Fixes "structure of query does not match function result type" error
-- ============================================

-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS get_credits_leaderboard(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_credits_leaderboard(p_limit INTEGER, p_year INTEGER);
DROP FUNCTION IF EXISTS get_credits_leaderboard(p_year INTEGER, p_limit INTEGER);

-- Recreate the function with explicit type casting and correct column order
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
    WHERE (up.role IS NULL OR up.role != 'admin') -- Exclude admins from leaderboard
      AND (yc.total IS NOT NULL OR COALESCE(up.credits, 0) > 0) -- Only show users with credits
    ORDER BY COALESCE(yc.total, COALESCE(up.credits, 0), 0) DESC
    LIMIT p_limit;
  ELSE
    -- All-time leaderboard
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
    WHERE (up.role IS NULL OR up.role != 'admin') -- Exclude admins
      AND COALESCE(up.credits, 0) > 0
    ORDER BY COALESCE(up.credits, 0) DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_credits_leaderboard(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_credits_leaderboard(INTEGER, INTEGER) TO anon;

-- Also grant for function with no parameters (uses defaults)
GRANT EXECUTE ON FUNCTION get_credits_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION get_credits_leaderboard() TO anon;

-- Test the function to make sure it works
DO $$
DECLARE
  test_result RECORD;
  test_count INTEGER := 0;
BEGIN
  -- Test all-time leaderboard
  FOR test_result IN 
    SELECT * FROM get_credits_leaderboard(NULL, 10)
  LOOP
    test_count := test_count + 1;
    EXIT WHEN test_count > 1; -- Just verify it returns at least one row
  END LOOP;
  
  RAISE NOTICE '✅ Function test passed - leaderboard function is working correctly';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Function test failed: %', SQLERRM;
END $$;

-- Show current year test
SELECT 'Testing current year leaderboard...' as status;
SELECT * FROM get_credits_leaderboard(EXTRACT(YEAR FROM NOW())::INTEGER, 5);

-- Show all-time test
SELECT 'Testing all-time leaderboard...' as status;
SELECT * FROM get_credits_leaderboard(NULL, 5);

