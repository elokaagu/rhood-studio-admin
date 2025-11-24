-- Refresh PostgREST schema cache after creating new tables
-- This makes new tables immediately available via Supabase API

-- Method 1: Notify PostgREST to reload schema
-- This will cause PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Method 2: Verify the table exists first
SELECT 
  'credit_transactions' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'credit_transactions'
    ) 
    THEN '✅ EXISTS - Now refreshing schema cache...'
    ELSE '❌ DOES NOT EXIST - Please run RUN_ALL_CREDITS_MIGRATIONS.sql first'
  END as status;

-- Method 3: List all credit-related tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%credit%'
ORDER BY table_name;

