# Fix Schema Cache Error (PGRST205)

## Quick Fix Instructions

The schema cache error occurs when Supabase's PostgREST hasn't refreshed its cache after new tables were created. Follow these steps:

### Option 1: Run SQL Script (Recommended - Fastest)

1. **Open Supabase Dashboard**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Fix Script**
   - Open the file: `supabase/migrations/FIX_SCHEMA_CACHE_PGRST205.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click "Run" or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

4. **Wait and Refresh**
   - Wait 10-30 seconds for PostgREST to reload
   - Hard refresh your browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - The error should now be resolved!

### Option 2: Use Dashboard UI

1. **Go to Settings**
   - In Supabase Dashboard, click "Settings" (gear icon)
   - Click "API" in the left sidebar

2. **Refresh Schema Cache**
   - Scroll down to find "Schema Cache" section
   - Click "Refresh Schema Cache" or "Reload Schema"
   - Wait 10-30 seconds

3. **Refresh Browser**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### Option 3: Wait (Automatic)

Sometimes the cache refreshes automatically within 1-2 minutes. You can:
- Wait a minute or two
- Refresh the page
- Check if the error is gone

## Verify It's Fixed

After running the fix, the Credit Transactions page should:
- ✅ Load without errors
- ✅ Show your transaction history
- ✅ Display summary cards (Total Earned, Total Spent, Net Credits)

## If Error Persists

If the error still appears after trying all options:

1. **Verify Table Exists**
   - Run `CHECK_CREDITS_TABLE_EXISTS.sql` in SQL Editor
   - If table doesn't exist, run `RUN_ALL_CREDITS_MIGRATIONS.sql` first

2. **Check Console Logs**
   - Open browser DevTools (F12)
   - Look for any additional error messages
   - Check Network tab for failed requests

3. **Contact Support**
   - If issue persists, there may be a deeper configuration issue
   - Check Supabase status page for service issues

## Files Reference

- `supabase/migrations/FIX_SCHEMA_CACHE_PGRST205.sql` - Main fix script
- `supabase/migrations/CHECK_CREDITS_TABLE_EXISTS.sql` - Verify table exists
- `supabase/migrations/RUN_ALL_CREDITS_MIGRATIONS.sql` - Create tables if missing

