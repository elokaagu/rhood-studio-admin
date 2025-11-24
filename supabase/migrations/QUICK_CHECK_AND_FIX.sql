-- Quick check if credit_transactions table exists
-- Run this first to verify the table was created

-- Check 1: Does the table exist?
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'credit_transactions'
    ) 
    THEN '✅ Table EXISTS - Proceed to Step 2 (Refresh Cache)'
    ELSE '❌ Table DOES NOT EXIST - You need to run RUN_ALL_CREDITS_MIGRATIONS.sql first!'
  END as table_check;

-- Check 2: If table exists, try to refresh schema cache
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'credit_transactions'
  ) THEN
    -- Notify PostgREST to reload schema
    PERFORM pg_notify('pgrst', 'reload schema');
    RAISE NOTICE 'Schema cache refresh signal sent. Wait 10-30 seconds, then refresh your browser.';
  ELSE
    RAISE NOTICE 'Table does not exist. Please run RUN_ALL_CREDITS_MIGRATIONS.sql first.';
  END IF;
END $$;

-- List credit-related tables
SELECT 
  'credit_transactions' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'credit_transactions'
  ) as exists;

SELECT 
  'opportunity_boosts' as table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'opportunity_boosts'
  ) as exists;

SELECT 
  'user_profiles.credits' as column_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
    AND column_name = 'credits'
  ) as exists;

