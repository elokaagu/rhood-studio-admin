-- Quick check to verify credits system tables exist
-- Run this in Supabase SQL Editor to check if tables are set up correctly

-- Check if credit_transactions table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'credit_transactions'
    ) 
    THEN '✅ credit_transactions table EXISTS'
    ELSE '❌ credit_transactions table DOES NOT EXIST'
  END as credit_transactions_status;

-- Check if user_profiles.credits column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_profiles'
      AND column_name = 'credits'
    ) 
    THEN '✅ credits column EXISTS on user_profiles'
    ELSE '❌ credits column DOES NOT EXIST on user_profiles'
  END as credits_column_status;

-- Check if opportunity_boosts table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'opportunity_boosts'
    ) 
    THEN '✅ opportunity_boosts table EXISTS'
    ELSE '❌ opportunity_boosts table DOES NOT EXIST'
  END as opportunity_boosts_status;

-- Check if get_credits_leaderboard function exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = 'get_credits_leaderboard'
    ) 
    THEN '✅ get_credits_leaderboard function EXISTS'
    ELSE '❌ get_credits_leaderboard function DOES NOT EXIST'
  END as leaderboard_function_status;

-- List all tables in public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

