# Troubleshoot Image Loading Issues

## Current Problem
Images are failing to load with 400 errors, even though the opportunity was updated successfully.

## Step-by-Step Fix

### Step 1: Check Storage Bucket Status

1. **Go to Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Check Storage**
   - Click **"Storage"** in left sidebar
   - Verify you see an `opportunities` bucket
   - If not, create it using the `setup-storage-quick.sql` script

### Step 2: Verify Bucket Permissions

1. **Click on `opportunities` bucket**
2. **Go to "Policies" tab**
3. **Ensure these policies exist:**

   **Policy 1 - Public Read:**
   ```
   Name: Public read access for opportunities bucket
   Policy: SELECT
   Target roles: public
   USING: bucket_id = 'opportunities'
   ```

   **Policy 2 - Authenticated Upload:**
   ```
   Name: Authenticated upload to opportunities bucket  
   Policy: INSERT
   Target roles: authenticated
   WITH CHECK: bucket_id = 'opportunities' AND auth.role() = 'authenticated'
   ```

### Step 3: Check Image URLs in Database

1. **Go to Table Editor**
   - Click **"Table Editor"** in left sidebar
   - Click on **"opportunities"** table
   - Check the `image_url` column values

2. **Look for invalid URLs**
   - URLs should start with `https://` and your Supabase domain
   - Example: `https://your-project.supabase.co/storage/v1/object/public/opportunities/images/filename.jpg`

### Step 4: Fix Invalid Image URLs

If you see invalid URLs in the database:

1. **Delete the invalid URLs:**
   ```sql
   UPDATE opportunities 
   SET image_url = NULL 
   WHERE image_url NOT LIKE 'https://%';
   ```

2. **Or update them to valid format:**
   ```sql
   UPDATE opportunities 
   SET image_url = CONCAT('https://your-project.supabase.co/storage/v1/object/public/', image_url)
   WHERE image_url NOT LIKE 'https://%';
   ```

### Step 5: Test Image Upload

1. **Go to Create Opportunity page**
2. **Try uploading a new image**
3. **Check browser console for errors**
4. **Verify image appears in Storage bucket**

### Step 6: Verify Public URL Generation

The issue might be in how we generate public URLs. Let me check the ImageUpload component.

## Common Issues & Solutions

### Issue 1: Bucket Not Public
**Solution:** Make sure the bucket is marked as public in Supabase dashboard

### Issue 2: Invalid URL Format
**Solution:** Check that image URLs in database follow the correct format:
```
https://your-project.supabase.co/storage/v1/object/public/opportunities/images/filename.jpg
```

### Issue 3: Missing Policies
**Solution:** Ensure all required RLS policies are in place (see Step 2)

### Issue 4: File Permissions
**Solution:** Check that uploaded files have public read permissions

## Quick Fix Commands

If you want to reset and start fresh:

1. **Delete all images from bucket:**
   - Go to Storage → opportunities bucket
   - Delete all files in the images folder

2. **Clear image URLs from database:**
   ```sql
   UPDATE opportunities SET image_url = NULL;
   ```

3. **Re-upload images:**
   - Go to edit opportunity pages
   - Upload new images

## Verification Steps

After fixing:

1. ✅ **Storage bucket exists and is public**
2. ✅ **RLS policies are correctly set**
3. ✅ **Image URLs in database are valid**
4. ✅ **Images upload successfully**
5. ✅ **Images display without 400 errors**

## Next Steps

Once fixed:
- Test creating new opportunities with images
- Test editing existing opportunities and changing images
- Verify images display correctly in all views
