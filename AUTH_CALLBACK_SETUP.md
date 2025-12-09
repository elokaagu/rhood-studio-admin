# Auth Callback Setup Guide

This guide explains how to configure email confirmation redirects for Supabase authentication.

## Problem

When users sign up and receive the email confirmation link, clicking it might try to redirect to `localhost`, which doesn't work if:
- The development server isn't running
- The user is accessing the link from a different device
- The app is deployed to production

## Solution

We've implemented a proper auth callback handler at `/auth/callback` that:
1. Handles email confirmation tokens
2. Exchanges authentication codes
3. Redirects users to the dashboard after successful confirmation

## Required Configuration

### 1. Supabase Dashboard Configuration

You need to add the callback URL to your Supabase project's allowed redirect URLs:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **URL Configuration**
4. Add the following URLs to **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://portal.rhood.co/auth/callback` (for production)
   - Or your production URL: `https://your-domain.com/auth/callback`

5. Also add the same URLs to **Site URL** (the primary URL):
   - Development: `http://localhost:3000`
   - Production: `https://portal.rhood.co` (or your production URL)

### 2. Environment Variables

Make sure you have the following environment variables set:

```env
# For production/staging
NEXT_PUBLIC_APP_URL=https://portal.rhood.co
NEXT_PUBLIC_SITE_URL=https://portal.rhood.co

# For local development (optional, will default to localhost:3000)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. How It Works

1. User signs up on the login page
2. Supabase sends a confirmation email with a link
3. The link includes a redirect URL pointing to `/auth/callback`
4. User clicks the link in their email
5. The callback page:
   - Extracts the authentication token from the URL
   - Exchanges it for a session
   - Redirects to `/admin/dashboard`

## Testing

1. **Local Testing:**
   - Make sure your dev server is running (`npm run dev`)
   - Sign up with a test email
   - Click the confirmation link in the email
   - You should be redirected to `http://localhost:3000/auth/callback` and then to the dashboard

2. **Production Testing:**
   - Deploy your app
   - Sign up with a test email
   - Click the confirmation link
   - You should be redirected to your production URL's callback route and then to the dashboard

## Troubleshooting

### "Invalid confirmation link" error
- Check that the redirect URL is added to Supabase Dashboard
- Verify that `NEXT_PUBLIC_APP_URL` is set correctly
- Make sure the URL in the email matches what's configured in Supabase

### Connection refused error
- If you see `localhost refused to connect`, the callback URL in Supabase isn't set correctly
- Make sure you've added the production URL to Supabase Dashboard
- The email link should point to your production URL, not localhost

### Still redirecting to localhost
- Check your Supabase project settings for the Site URL
- Update the email template to use the correct confirmation URL
- Verify environment variables are set correctly in your deployment platform

## Additional Notes

- The callback page handles both email confirmation tokens (in URL hash) and PKCE code exchange (in query params)
- If authentication fails, users are redirected to login with an error message
- The callback page shows a loading spinner while processing the authentication

