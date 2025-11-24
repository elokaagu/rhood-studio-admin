-- ============================================
-- FIX PGRST205 SCHEMA CACHE ERROR
-- This script fixes the "table not found in schema cache" error
-- Run this in Supabase SQL Editor when you see PGRST205 errors
-- ============================================

-- Step 1: Verify the table actually exists in the database
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
  
  IF table_exists THEN
    RAISE NOTICE '✅ credit_transactions table EXISTS in database';
    RAISE NOTICE 'Proceeding to refresh PostgREST schema cache...';
  ELSE
    RAISE EXCEPTION '❌ credit_transactions table DOES NOT EXIST! Please run RUN_ALL_CREDITS_MIGRATIONS.sql first.';
  END IF;
END $$;

-- Step 2: Force PostgREST to reload schema cache
-- Method 1: Use pg_notify to signal PostgREST
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  RAISE NOTICE '✅ Sent schema reload signal to PostgREST';
END $$;

-- Step 3: Verify all credit-related tables exist
SELECT 
  'credit_transactions' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'credit_transactions'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT 
  'opportunity_boosts' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'opportunity_boosts'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
UNION ALL
SELECT 
  'user_profiles.credits' as table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
      AND column_name = 'credits'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Step 4: Final instructions
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Schema cache refresh signal sent!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEPS:';
  RAISE NOTICE '1. Wait 10-30 seconds for PostgREST to reload';
  RAISE NOTICE '2. Refresh your browser (hard refresh: Ctrl+Shift+R or Cmd+Shift+R)';
  RAISE NOTICE '3. If error persists, go to Supabase Dashboard → Settings → API → Refresh Schema Cache';
  RAISE NOTICE '';
  RAISE NOTICE 'If the table shows as MISSING above, run RUN_ALL_CREDITS_MIGRATIONS.sql first.';
  RAISE NOTICE '========================================';
END $$;

