-- ============================================
-- CHECK USER CREDITS STATUS
-- This script shows exactly what credits users have
-- ============================================

-- Show all non-admin users and their credits
SELECT 
  'User Credits Status' as section,
  '' as detail
UNION ALL
SELECT 
  'Total non-admin users' as section,
  COUNT(*)::TEXT as detail
FROM user_profiles
WHERE (role IS NULL OR role != 'admin')
UNION ALL
SELECT 
  'Users with credits > 0' as section,
  COUNT(*)::TEXT as detail
FROM user_profiles
WHERE (role IS NULL OR role != 'admin')
  AND COALESCE(credits, 0) > 0
UNION ALL
SELECT 
  'Users with credits = 0' as section,
  COUNT(*)::TEXT as detail
FROM user_profiles
WHERE (role IS NULL OR role != 'admin')
  AND COALESCE(credits, 0) = 0
UNION ALL
SELECT 
  'Users with NULL credits' as section,
  COUNT(*)::TEXT as detail
FROM user_profiles
WHERE (role IS NULL OR role != 'admin')
  AND credits IS NULL;

-- Show individual user credits
SELECT 
  id,
  COALESCE(dj_name, brand_name, first_name || ' ' || last_name, email) as name,
  email,
  COALESCE(credits, 0) as credits,
  credits IS NULL as is_null,
  role
FROM user_profiles
WHERE (role IS NULL OR role != 'admin')
ORDER BY COALESCE(credits, 0) DESC, name;

-- Check if credits column exists
SELECT 
  'Column Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
      AND column_name = 'credits'
    ) 
    THEN '✅ credits column EXISTS'
    ELSE '❌ credits column DOES NOT EXIST - Run RUN_ALL_CREDITS_MIGRATIONS.sql'
  END as status;

-- Show total credits in system
SELECT 
  'Total Credits' as metric,
  COALESCE(SUM(credits), 0)::TEXT as value
FROM user_profiles
WHERE (role IS NULL OR role != 'admin');

-- Show credit transactions count
SELECT 
  'Credit Transactions' as metric,
  COUNT(*)::TEXT as value
FROM credit_transactions;

