# Vercel Deployment Fix Guide

## Current Issues

- ChunkLoadError: Loading chunk 435 failed
- Failed to fetch RSC payload
- Application error: Client-side exception

## Solutions to Try

### 1. Clear Vercel Build Cache

If the deployment continues to fail, you can clear the build cache:

1. Go to your Vercel dashboard
2. Navigate to your project
3. Go to Settings → Functions
4. Clear the build cache
5. Trigger a new deployment

### 2. Force New Deployment

```bash
# Trigger a new deployment by making a small change
git commit --allow-empty -m "Force new deployment to fix chunk errors"
git push origin main
```

### 3. Check Environment Variables

Ensure all required environment variables are set in Vercel:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (if needed)

### 4. Node.js Version

Ensure Vercel is using the correct Node.js version (18.x or 20.x):

1. Go to Vercel dashboard → Project Settings → General
2. Set Node.js Version to 18.x or 20.x

### 5. Build Command

If needed, you can override the build command in Vercel:

1. Go to Project Settings → Build & Output Settings
2. Set Build Command to: `npm run build`
3. Set Output Directory to: `.next`

## Common Causes of ChunkLoadError

1. **Caching Issues**: Old cached chunks don't match new deployment
2. **CDN Issues**: Content delivery network serving stale files
3. **Build Issues**: Incomplete or corrupted build artifacts
4. **Environment Issues**: Missing or incorrect environment variables

## Quick Fix

The most common fix is to clear the browser cache and wait for the new deployment to complete. The chunk loading errors usually resolve once the new deployment is fully propagated.

