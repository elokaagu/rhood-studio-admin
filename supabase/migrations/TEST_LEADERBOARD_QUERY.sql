-- ============================================
-- TEST LEADERBOARD FUNCTION
-- This script tests if the leaderboard function works correctly
-- ============================================

-- Test 1: Check if function exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = 'get_credits_leaderboard'
    ) 
    THEN '✅ Function EXISTS'
    ELSE '❌ Function DOES NOT EXIST - Run FIX_LEADERBOARD_FUNCTION_TYPE_ERROR.sql'
  END as function_status;

-- Test 2: Test all-time leaderboard (NULL year)
SELECT '=== ALL-TIME LEADERBOARD (Top 10) ===' as test;
SELECT * FROM get_credits_leaderboard(NULL, 10);

-- Test 3: Test current year leaderboard
SELECT '=== CURRENT YEAR LEADERBOARD (Top 10) ===' as test;
SELECT * FROM get_credits_leaderboard(EXTRACT(YEAR FROM NOW())::INTEGER, 10);

-- Test 4: Test 2025 leaderboard
SELECT '=== 2025 LEADERBOARD (Top 10) ===' as test;
SELECT * FROM get_credits_leaderboard(2025, 10);

-- Test 5: Show user_profiles with credits directly
SELECT '=== USER PROFILES WITH CREDITS (Direct Query) ===' as test;
SELECT 
  id as user_id,
  dj_name,
  brand_name,
  first_name,
  last_name,
  email,
  COALESCE(credits, 0) as total_credits
FROM user_profiles
WHERE (role IS NULL OR role != 'admin')
  AND COALESCE(credits, 0) > 0
ORDER BY credits DESC NULLS LAST
LIMIT 10;

-- Test 6: Count total users with credits
SELECT 
  'Total users with credits' as metric,
  COUNT(*)::TEXT as value
FROM user_profiles
WHERE (role IS NULL OR role != 'admin')
  AND COALESCE(credits, 0) > 0;

-- Test 7: Show credit transactions summary
SELECT 
  'Total credit transactions' as metric,
  COUNT(*)::TEXT as value
FROM credit_transactions

UNION ALL

SELECT 
  'Total credits earned (positive)' as metric,
  SUM(amount)::TEXT as value
FROM credit_transactions
WHERE amount > 0

UNION ALL

SELECT 
  'Total credits spent (negative)' as metric,
  ABS(SUM(amount))::TEXT as value
FROM credit_transactions
WHERE amount < 0;

