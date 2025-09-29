# Complete Database Setup Instructions

## Fixing the "Error creating opportunity" Issue

The error you're seeing is because the required database tables don't exist in your Supabase database yet. Here's how to fix it:

### Step 1: Create All Required Tables

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `jsmcduecuxtaqizhmiqo`
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

#### Run these SQL scripts in order:

**1. First, run `setup-user-profiles-table.sql`:**

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dj_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  genres TEXT[],
  bio TEXT,
  instagram TEXT,
  soundcloud TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes and policies...
-- (Copy the full contents of setup-user-profiles-table.sql)
```

**2. Then, run `setup-opportunities-table.sql`:**

```sql
-- Create opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  payment DECIMAL(10,2),
  genre TEXT,
  skill_level TEXT,
  organizer_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes and policies...
-- (Copy the full contents of setup-opportunities-table.sql)
```

**3. Finally, run `setup-applications-table.sql`:**

```sql
-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes and policies...
-- (Copy the full contents of setup-applications-table.sql)
```

**4. And run `setup-mixes-table.sql` (if you haven't already):**

```sql
-- Create mixes table
CREATE TABLE IF NOT EXISTS mixes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  genre TEXT NOT NULL,
  description TEXT,
  applied_for TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  duration TEXT,
  plays INTEGER DEFAULT 0,
  rating DECIMAL(3,1) DEFAULT 0.0,
  uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage bucket and policies...
-- (Copy the full contents of setup-mixes-table.sql)
```

### Step 2: Verify the Setup

After running all SQL scripts, you should see these tables in the **Table Editor**:

- ✅ `user_profiles`
- ✅ `opportunities`
- ✅ `applications`
- ✅ `mixes`

And in **Storage**, you should see:

- ✅ `mixes` bucket

### Step 3: Test the Application

1. Refresh your application
2. Try creating an opportunity - it should now work without errors
3. Check other pages (applications, members, mixes) - they should all work

## What Each Table Does

### **user_profiles**

- Stores DJ/member information
- Used by the Members page
- Referenced by applications and mixes

### **opportunities**

- Stores DJ gig opportunities
- Used by the Opportunities page
- Referenced by applications

### **applications**

- Stores applications from DJs to opportunities
- Used by the Applications page
- Links users to opportunities

### **mixes**

- Stores uploaded DJ mixes
- Used by the Mixes page
- Includes file storage for audio files

## Troubleshooting

If you still see errors:

1. **Check the SQL Editor**: Make sure all statements executed successfully
2. **Verify Tables**: Go to Table Editor and confirm all tables exist
3. **Check Console**: Look for any new error messages
4. **Check Storage**: Ensure the `mixes` bucket exists

## Next Steps

Once all tables are created, the application will:

- ✅ Create opportunities without errors
- ✅ Load real data from the database
- ✅ Allow you to manage applications, members, and mixes
- ✅ Show helpful error messages if anything goes wrong

The application now has comprehensive error handling and will guide you through any setup issues!
