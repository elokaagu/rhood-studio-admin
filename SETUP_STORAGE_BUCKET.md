# Fix Image Upload - Storage Bucket Setup

## Issue
The image upload is failing with "Bucket not found" error because the Supabase storage bucket hasn't been created yet.

## Solution
You need to create the storage bucket in your Supabase dashboard. Here's how:

### Method 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to Storage**
   - In the left sidebar, click on **"Storage"**
   - You should see an empty storage section

3. **Create New Bucket**
   - Click **"New bucket"** button
   - **Bucket name**: `opportunities`
   - **Public bucket**: ✅ Check this box (important!)
   - Click **"Create bucket"**

4. **Set Bucket Policies**
   - Click on your newly created `opportunities` bucket
   - Go to the **"Policies"** tab
   - Click **"New Policy"**

   **Create these 4 policies:**

   **Policy 1 - Public Read Access:**
   ```
   Name: Public read access
   Policy: SELECT
   Target roles: public
   USING expression: true
   ```

   **Policy 2 - Authenticated Upload:**
   ```
   Name: Authenticated upload
   Policy: INSERT
   Target roles: authenticated
   WITH CHECK expression: true
   ```

   **Policy 3 - Authenticated Update:**
   ```
   Name: Authenticated update
   Policy: UPDATE
   Target roles: authenticated
   USING expression: true
   ```

   **Policy 4 - Authenticated Delete:**
   ```
   Name: Authenticated delete
   Policy: DELETE
   Target roles: authenticated
   USING expression: true
   ```

### Method 2: Using SQL Editor (Alternative)

1. **Go to SQL Editor**
   - In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
   - Click **"New query"**

2. **Run the Setup Script**
   - Copy and paste the contents of `setup-opportunities-storage.sql`
   - Click **"Run"** to execute

### Method 3: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Initialize Supabase in your project (if not already done)
supabase init

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply the storage setup
supabase db reset
```

## Verification

After creating the bucket:

1. **Check Storage Section**
   - Go back to Storage in your Supabase dashboard
   - You should see the `opportunities` bucket listed

2. **Test Upload**
   - Try uploading an image in your application
   - Check the browser console - the "Bucket not found" error should be gone

3. **Check Bucket Contents**
   - Click on the `opportunities` bucket
   - You should see uploaded images in the `images/` folder

## Troubleshooting

### If you still get "Bucket not found" error:

1. **Check bucket name**: Make sure it's exactly `opportunities` (lowercase)
2. **Check project**: Ensure you're in the correct Supabase project
3. **Refresh browser**: Sometimes the changes take a moment to propagate
4. **Check RLS policies**: Make sure the bucket has proper policies set

### If upload works but images don't display:

1. **Check bucket is public**: The bucket must be marked as public
2. **Check file permissions**: Ensure the uploaded files are publicly accessible
3. **Check URL format**: The public URL should be accessible in browser

## Expected Result

After setup, your image upload should work without errors and you should see:
- ✅ No "Bucket not found" errors in console
- ✅ Successful image uploads
- ✅ Images displaying in opportunity cards and detail pages
- ✅ Images stored in `opportunities/images/` folder in Supabase Storage

## Next Steps

Once the bucket is created and working:
1. Test creating a new opportunity with an image
2. Test editing an existing opportunity and changing its image
3. Verify images display correctly in the opportunities list and detail pages
