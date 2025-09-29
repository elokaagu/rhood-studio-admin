# Database Setup Instructions

## Fixing the "Error fetching mixes" Issue

The error you're seeing is because the `mixes` table doesn't exist in your Supabase database yet. Here's how to fix it:

### Step 1: Create the Mixes Table

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `jsmcduecuxtaqizhmiqo`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `setup-mixes-table.sql` into the editor
6. Click **Run** to execute the SQL

This will create:
- The `mixes` table with all required fields
- Proper indexes for performance
- Row Level Security policies
- Storage bucket for audio files
- Storage policies for file uploads

### Step 2: Verify the Setup

After running the SQL, you should see:
- The `mixes` table in the **Table Editor**
- The `mixes` storage bucket in **Storage**
- No more console errors when loading the mixes page

### Step 3: Test the Application

1. Refresh your application
2. Go to the **Mixes** page
3. Try uploading a mix - it should now work without errors
4. The mix should appear in the list after upload

## What the SQL Does

The setup script creates:

### Database Table
- **mixes**: Stores mix metadata (title, artist, genre, file info, etc.)
- **Indexes**: For better query performance
- **RLS Policies**: Allows admin access to all operations
- **Triggers**: Automatically updates `updated_at` timestamp

### Storage Bucket
- **mixes**: For storing audio files
- **Policies**: Allows authenticated users to upload/manage files
- **Public Access**: Allows public read access for audio playback

## Troubleshooting

If you still see errors:

1. **Check the SQL Editor**: Make sure all statements executed successfully
2. **Verify Table Exists**: Go to Table Editor and confirm `mixes` table is there
3. **Check Storage**: Go to Storage and confirm `mixes` bucket exists
4. **Check Console**: Look for any new error messages

## Next Steps

Once the table is created, the application will:
- Load mixes from the database instead of demo data
- Allow you to upload new mixes
- Store files in Supabase Storage
- Display real data with proper error handling

The application now has better error handling and will show helpful messages if the database setup is incomplete.
