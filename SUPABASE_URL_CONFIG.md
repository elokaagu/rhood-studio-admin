# Supabase URL Configuration Guide

## Current Configuration

Based on your setup, here's what you need:

### Site URL
✅ **Current:** `https://rhood-studio.vercel.app`
- This is correct for production
- Keep this as-is

### Redirect URLs - You Need to Add:

1. **Click "Add URL"** button
2. Add: `https://rhood-studio.vercel.app/auth/callback`
   - This is REQUIRED for email confirmation to work
   - Without this, users clicking email confirmation links will get errors

3. **Optional - For Local Development:**
   - Add: `http://localhost:3000/auth/callback`
   - Only needed if you want to test email confirmation locally

### Your Complete Redirect URLs Should Be:

```
✅ rhoodapp://auth/callback          (Keep - for mobile app)
✅ rhoodapp://*                       (Keep - for mobile app)
✅ exp://localhost:8081               (Keep - for Expo)
✅ https://rhood-studio.vercel.app    (Keep - base URL)
➕ https://rhood-studio.vercel.app/auth/callback  (ADD THIS!)
➕ http://localhost:3000/auth/callback            (Optional - for local dev)
```

## Why This Matters

When users sign up and click the email confirmation link, Supabase will:
1. Check if the redirect URL matches one in your "Redirect URLs" list
2. If it matches, redirect them to that URL
3. If it doesn't match, use the "Site URL" as a fallback

Since we're now using `/auth/callback` as our callback route, you MUST add it to the Redirect URLs list, otherwise Supabase won't allow redirects to that path.

## After Adding

Once you add `https://rhood-studio.vercel.app/auth/callback`:
- ✅ Email confirmation links will work correctly
- ✅ Users will be redirected to the callback page
- ✅ They'll then be automatically logged in and sent to the dashboard

## Note About portal.rhood.co

I noticed your README mentions `https://portal.rhood.co` as the production URL, but your Supabase is configured for `https://rhood-studio.vercel.app`. 

- If `portal.rhood.co` is your actual production domain, update both Site URL and add its callback URL
- If `rhood-studio.vercel.app` is your production URL, you're good with the current Site URL


