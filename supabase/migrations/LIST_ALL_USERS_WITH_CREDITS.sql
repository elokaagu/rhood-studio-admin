-- ============================================
-- LIST ALL USERS WITH CREDITS
-- Shows all users who have credits > 0, ranked by credits
-- ============================================

-- Show all users with credits (ranked by total credits)
SELECT 
  ROW_NUMBER() OVER (ORDER BY COALESCE(up.credits, 0) DESC) as rank,
  up.id as user_id,
  COALESCE(up.dj_name, up.brand_name, up.first_name || ' ' || up.last_name, up.email) as display_name,
  up.email,
  up.dj_name,
  up.brand_name,
  up.first_name,
  up.last_name,
  COALESCE(up.credits, 0) as total_credits,
  up.role,
  COUNT(ct.id) as transaction_count,
  up.created_at
FROM user_profiles up
LEFT JOIN credit_transactions ct ON ct.user_id = up.id
WHERE (up.role IS NULL OR up.role != 'admin')
  AND COALESCE(up.credits, 0) > 0
GROUP BY up.id, up.dj_name, up.brand_name, up.first_name, up.last_name, up.email, up.credits, up.role, up.created_at
ORDER BY COALESCE(up.credits, 0) DESC;

-- Summary statistics
SELECT 
  'Summary' as section,
  '' as value
UNION ALL
SELECT 
  'Total users with credits' as section,
  COUNT(*)::TEXT as value
FROM user_profiles
WHERE (role IS NULL OR role != 'admin')
  AND COALESCE(credits, 0) > 0
UNION ALL
SELECT 
  'Total credits in system' as section,
  COALESCE(SUM(credits), 0)::TEXT as value
FROM user_profiles
WHERE (role IS NULL OR role != 'admin')
UNION ALL
SELECT 
  'Average credits per user' as section,
  ROUND(AVG(credits), 2)::TEXT as value
FROM user_profiles
WHERE (role IS NULL OR role != 'admin')
  AND COALESCE(credits, 0) > 0
UNION ALL
SELECT 
  'Highest credits' as section,
  MAX(credits)::TEXT as value
FROM user_profiles
WHERE (role IS NULL OR role != 'admin')
  AND COALESCE(credits, 0) > 0
UNION ALL
SELECT 
  'Lowest credits (non-zero)' as section,
  MIN(credits)::TEXT as value
FROM user_profiles
WHERE (role IS NULL OR role != 'admin')
  AND COALESCE(credits, 0) > 0;

-- Show credit transactions breakdown by type
SELECT 
  transaction_type,
  COUNT(*) as transaction_count,
  SUM(amount) as total_credits,
  AVG(amount) as average_amount
FROM credit_transactions
GROUP BY transaction_type
ORDER BY total_credits DESC;

-- Show users with their credit transaction history summary
SELECT 
  COALESCE(up.dj_name, up.brand_name, up.first_name || ' ' || up.last_name, up.email) as user_name,
  up.email,
  up.credits as current_credits,
  COUNT(ct.id) as total_transactions,
  SUM(CASE WHEN ct.amount > 0 THEN ct.amount ELSE 0 END) as total_earned,
  SUM(CASE WHEN ct.amount < 0 THEN ABS(ct.amount) ELSE 0 END) as total_spent,
  MAX(ct.created_at) as last_transaction_date
FROM user_profiles up
LEFT JOIN credit_transactions ct ON ct.user_id = up.id
WHERE (up.role IS NULL OR up.role != 'admin')
  AND COALESCE(up.credits, 0) > 0
GROUP BY up.id, up.dj_name, up.brand_name, up.first_name, up.last_name, up.email, up.credits
ORDER BY up.credits DESC;

