# How to Fix PGRST205 Schema Cache Error

## The Problem
The error `PGRST205: Could not find the table 'public.credit_transactions' in the schema cache` means that:
- ✅ The table **exists** in your PostgreSQL database
- ❌ But PostgREST (Supabase API) hasn't refreshed its schema cache yet

## Quick Fix (Recommended)

### Step 1: Run the Fix Script
1. Open **Supabase SQL Editor**
2. Copy and run: `FIX_SCHEMA_CACHE_PGRST205.sql`
3. Wait 10-30 seconds
4. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

### Step 2: Alternative - Use Supabase Dashboard
1. Go to **Supabase Dashboard**
2. Navigate to **Settings** → **API**
3. Scroll to **Schema Cache** section
4. Click **"Refresh Schema Cache"** or **"Reload"**
5. Wait 10-30 seconds
6. Refresh your browser

## Verify the Table Exists First

Before fixing the cache, make sure the table actually exists:
1. Run `CHECK_CREDITS_TABLE_EXISTS.sql` in SQL Editor
2. If it says "DOES NOT EXIST", run `RUN_ALL_CREDITS_MIGRATIONS.sql` first

## Automatic Retry (Already Implemented)

The Credit Transactions page now:
- ✅ Automatically retries up to 3 times with exponential backoff
- ✅ Shows helpful error messages
- ✅ Provides a "Retry" button after auto-retries fail

## Why This Happens

After creating new tables via SQL migrations, PostgREST needs to:
1. Detect the schema change
2. Reload its internal schema cache
3. Make the table available via the API

This usually happens automatically within 1-2 minutes, but can be forced using the methods above.

## Files Reference

- `FIX_SCHEMA_CACHE_PGRST205.sql` - Quick fix script (use this!)
- `CHECK_CREDITS_TABLE_EXISTS.sql` - Verify tables exist
- `RUN_ALL_CREDITS_MIGRATIONS.sql` - Full migration (run if tables don't exist)
- `QUICK_CHECK_AND_FIX.sql` - Combined check + fix

