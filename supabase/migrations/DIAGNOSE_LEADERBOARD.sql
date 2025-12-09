-- ============================================
-- DIAGNOSTIC SCRIPT: Check Leaderboard Setup
-- Run this to diagnose why the leaderboard is empty
-- ============================================

-- 1. Check if credits column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'credits'
  ) THEN
    RAISE NOTICE '✅ Credits column exists';
  ELSE
    RAISE WARNING '❌ Credits column does NOT exist! Run RUN_ALL_CREDITS_MIGRATIONS.sql first.';
  END IF;
END $$;

-- 2. Check total users
SELECT 
  'Total Users' as check_type,
  COUNT(*) as count
FROM user_profiles;

-- 3. Check users with credits > 0
SELECT 
  'Users with Credits > 0' as check_type,
  COUNT(*) as count
FROM user_profiles
WHERE COALESCE(credits, 0) > 0;

-- 4. Check users with credits = 0 or null
SELECT 
  'Users with 0 or NULL credits' as check_type,
  COUNT(*) as count
FROM user_profiles
WHERE COALESCE(credits, 0) = 0;

-- 5. Show sample users and their credits (top 10)
SELECT 
  'Sample Users with Credits' as info,
  id,
  email,
  dj_name,
  brand_name,
  role,
  credits,
  COALESCE(credits, 0) as credits_value
FROM user_profiles
ORDER BY COALESCE(credits, 0) DESC
LIMIT 10;

-- 6. Check if leaderboard function exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'get_credits_leaderboard'
  ) THEN
    RAISE NOTICE '✅ Leaderboard function exists';
  ELSE
    RAISE WARNING '❌ Leaderboard function does NOT exist!';
  END IF;
END $$;

-- 7. Test the leaderboard function
SELECT 'Testing leaderboard function' as info;
SELECT * FROM get_credits_leaderboard(NULL, 10);

-- 8. Check RLS policies on user_profiles
SELECT 
  'RLS Policies on user_profiles' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'user_profiles'
AND cmd = 'SELECT';

-- Summary
DO $$
DECLARE
  total_users INTEGER;
  users_with_credits INTEGER;
  credits_column_exists BOOLEAN;
  function_exists BOOLEAN;
BEGIN
  -- Check counts
  SELECT COUNT(*) INTO total_users FROM user_profiles;
  SELECT COUNT(*) INTO users_with_credits FROM user_profiles WHERE COALESCE(credits, 0) > 0;
  
  -- Check if credits column exists
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'credits'
  ) INTO credits_column_exists;
  
  -- Check if function exists
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'get_credits_leaderboard'
  ) INTO function_exists;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNOSTIC SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Users with credits > 0: %', users_with_credits;
  RAISE NOTICE 'Credits column exists: %', credits_column_exists;
  RAISE NOTICE 'Leaderboard function exists: %', function_exists;
  RAISE NOTICE '';
  
  IF NOT credits_column_exists THEN
    RAISE WARNING '❌ FIX: Run RUN_ALL_CREDITS_MIGRATIONS.sql to add credits column';
  ELSIF users_with_credits = 0 THEN
    RAISE WARNING '❌ FIX: No users have credits. You need to populate credits for users.';
    RAISE NOTICE '   Run POPULATE_ALL_CREDITS.sql or manually assign credits to users.';
  ELSIF NOT function_exists THEN
    RAISE WARNING '❌ FIX: Leaderboard function missing. Run COMPLETE_SETUP_AND_FIX.sql';
  ELSE
    RAISE NOTICE '✅ Everything looks good! The leaderboard should work.';
    RAISE NOTICE '   If it still doesn''t work, check browser console for RLS errors.';
  END IF;
  
  RAISE NOTICE '========================================';
END $$;

