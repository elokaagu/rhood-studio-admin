# R/HOOD Studio - Database Schema & Setup Guide

## 🗄️ Database Overview

The R/HOOD Studio platform uses PostgreSQL via Supabase as its primary database. This guide covers the complete database schema, setup procedures, and maintenance tasks.

## 📋 Table Structure

### **Core Tables**

#### **1. user_profiles**

Stores DJ member information and profiles.

```sql
CREATE TABLE user_profiles (
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
```

**Indexes:**

```sql
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_dj_name ON user_profiles(dj_name);
CREATE INDEX idx_user_profiles_city ON user_profiles(city);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);
```

#### **2. opportunities**

Manages DJ gig opportunities and events.

```sql
CREATE TABLE opportunities (
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
```

**Indexes:**

```sql
CREATE INDEX idx_opportunities_event_date ON opportunities(event_date);
CREATE INDEX idx_opportunities_is_active ON opportunities(is_active);
CREATE INDEX idx_opportunities_genre ON opportunities(genre);
CREATE INDEX idx_opportunities_created_at ON opportunities(created_at);
```

#### **3. applications**

Tracks DJ applications for opportunities.

```sql
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**

```sql
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at);
```

#### **4. mixes**

Manages DJ mix submissions and files.

```sql
CREATE TABLE mixes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  genre TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  duration TEXT,
  image_url TEXT,
  uploaded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**

```sql
CREATE INDEX idx_mixes_artist ON mixes(artist);
CREATE INDEX idx_mixes_genre ON mixes(genre);
CREATE INDEX idx_mixes_uploaded_by ON mixes(uploaded_by);
CREATE INDEX idx_mixes_created_at ON mixes(created_at);
```

#### **5. communities**

Manages DJ communities and groups.

```sql
CREATE TABLE communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**

```sql
CREATE INDEX idx_communities_creator_id ON communities(creator_id);
CREATE INDEX idx_communities_created_at ON communities(created_at);
```

#### **6. community_members**

Tracks community membership.

```sql
CREATE TABLE community_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);
```

**Indexes:**

```sql
CREATE INDEX idx_community_members_community_id ON community_members(community_id);
CREATE INDEX idx_community_members_user_id ON community_members(user_id);
CREATE INDEX idx_community_members_joined_at ON community_members(joined_at);
```

#### **7. messages**

Stores community chat messages.

```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**

```sql
CREATE INDEX idx_messages_community_id ON messages(community_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
```

### **AI Features Tables**

#### **8. ai_matching_sessions**

Tracks AI-powered DJ-opportunity matching sessions.

```sql
CREATE TABLE ai_matching_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  matching_score DECIMAL(3,2),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**

```sql
CREATE INDEX idx_ai_matching_sessions_user_id ON ai_matching_sessions(user_id);
CREATE INDEX idx_ai_matching_sessions_opportunity_id ON ai_matching_sessions(opportunity_id);
CREATE INDEX idx_ai_matching_sessions_matching_score ON ai_matching_sessions(matching_score);
```

#### **9. ai_matching_feedback**

Stores user feedback on AI matching results.

```sql
CREATE TABLE ai_matching_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES ai_matching_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**

```sql
CREATE INDEX idx_ai_matching_feedback_session_id ON ai_matching_feedback(session_id);
CREATE INDEX idx_ai_matching_feedback_user_id ON ai_matching_feedback(user_id);
CREATE INDEX idx_ai_matching_feedback_rating ON ai_matching_feedback(rating);
```

### **Application Forms Tables**

#### **10. application_forms**

Manages dynamic application forms.

```sql
CREATE TABLE application_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **11. application_form_fields**

Defines form field configurations.

```sql
CREATE TABLE application_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES application_forms(id) ON DELETE CASCADE,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'select', 'checkbox', 'radio', 'file', 'date', 'number')),
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_placeholder TEXT,
  field_options JSONB,
  is_required BOOLEAN DEFAULT false,
  field_order INTEGER NOT NULL,
  validation_rules JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **12. application_form_responses**

Stores form submission responses.

```sql
CREATE TABLE application_form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID REFERENCES application_forms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE CASCADE,
  response_data JSONB NOT NULL,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES user_profiles(id),
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔐 Row Level Security (RLS)

### **RLS Policies**

All tables have Row Level Security enabled with admin-friendly policies:

```sql
-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_matching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_matching_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_form_responses ENABLE ROW LEVEL SECURITY;

-- Admin policies (allow all operations for admins)
CREATE POLICY "Admins can manage user_profiles" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Admins can manage opportunities" ON opportunities FOR ALL USING (true);
CREATE POLICY "Admins can manage applications" ON applications FOR ALL USING (true);
CREATE POLICY "Admins can manage mixes" ON mixes FOR ALL USING (true);
CREATE POLICY "Admins can manage communities" ON communities FOR ALL USING (true);
CREATE POLICY "Admins can manage community_members" ON community_members FOR ALL USING (true);
CREATE POLICY "Admins can manage messages" ON messages FOR ALL USING (true);
CREATE POLICY "Admins can manage ai_matching_sessions" ON ai_matching_sessions FOR ALL USING (true);
CREATE POLICY "Admins can manage ai_matching_feedback" ON ai_matching_feedback FOR ALL USING (true);
CREATE POLICY "Admins can manage application_forms" ON application_forms FOR ALL USING (true);
CREATE POLICY "Admins can manage application_form_fields" ON application_form_fields FOR ALL USING (true);
CREATE POLICY "Admins can manage application_form_responses" ON application_form_responses FOR ALL USING (true);
```

## 🔄 Triggers & Functions

### **Updated At Trigger**

```sql
-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mixes_updated_at
  BEFORE UPDATE ON mixes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_forms_updated_at
  BEFORE UPDATE ON application_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_form_fields_updated_at
  BEFORE UPDATE ON application_form_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_application_form_responses_updated_at
  BEFORE UPDATE ON application_form_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 📁 Storage Configuration

### **Supabase Storage Buckets**

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
('mixes', 'mixes', true),
('profile-images', 'profile-images', true),
('opportunity-images', 'opportunity-images', true);

-- Storage policies
CREATE POLICY "Public access for mixes" ON storage.objects
  FOR SELECT USING (bucket_id = 'mixes');

CREATE POLICY "Public access for profile images" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Public access for opportunity images" ON storage.objects
  FOR SELECT USING (bucket_id = 'opportunity-images');

CREATE POLICY "Admins can upload files" ON storage.objects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update files" ON storage.objects
  FOR UPDATE USING (true);

CREATE POLICY "Admins can delete files" ON storage.objects
  FOR DELETE USING (true);
```

## 🚀 Database Setup Scripts

### **Complete Setup Script**

```sql
-- Complete database setup for R/HOOD Studio
-- Run this script in your Supabase SQL Editor

-- 1. Create all tables
-- (Include all table creation statements from above)

-- 2. Create all indexes
-- (Include all index creation statements from above)

-- 3. Enable RLS and create policies
-- (Include all RLS policies from above)

-- 4. Create triggers
-- (Include all trigger creation statements from above)

-- 5. Create storage buckets
-- (Include storage bucket creation from above)

-- 6. Insert sample data (optional)
INSERT INTO user_profiles (first_name, last_name, dj_name, email, city, genres, bio) VALUES
('John', 'Doe', 'DJ Johnny', 'john@example.com', 'New York', ARRAY['House', 'Techno'], 'Professional DJ with 10 years experience'),
('Jane', 'Smith', 'DJ Jane', 'jane@example.com', 'Los Angeles', ARRAY['Deep House', 'Progressive'], 'Underground DJ and producer'),
('Mike', 'Johnson', 'DJ Mike', 'mike@example.com', 'Chicago', ARRAY['Tech House', 'Minimal'], 'Club DJ and event organizer');

INSERT INTO opportunities (title, description, location, event_date, payment, genre, skill_level, organizer_name) VALUES
('Summer Beach Party', 'Outdoor beach party with house music', 'Miami Beach', '2024-07-15 20:00:00', 500.00, 'House', 'Intermediate', 'Beach Events Inc'),
('Underground Club Night', 'Intimate club setting with techno', 'Brooklyn Warehouse', '2024-07-20 22:00:00', 300.00, 'Techno', 'Advanced', 'Underground Collective'),
('Rooftop Lounge', 'Chill vibes on rooftop', 'Downtown LA', '2024-07-25 19:00:00', 400.00, 'Deep House', 'Beginner', 'Skyline Events');

INSERT INTO communities (name, description, creator_id) VALUES
('House Music Lovers', 'Community for house music enthusiasts', (SELECT id FROM user_profiles WHERE dj_name = 'DJ Johnny')),
('Techno Underground', 'Underground techno community', (SELECT id FROM user_profiles WHERE dj_name = 'DJ Jane')),
('Deep House Collective', 'Deep house music community', (SELECT id FROM user_profiles WHERE dj_name = 'DJ Mike'));
```

## 🔧 Database Maintenance

### **Regular Maintenance Tasks**

```sql
-- 1. Update table statistics
ANALYZE;

-- 2. Vacuum tables to reclaim space
VACUUM ANALYZE;

-- 3. Check for unused indexes
SELECT
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_tup_read = 0;

-- 4. Monitor table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 5. Check for long-running queries
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

### **Performance Monitoring**

```sql
-- Query performance analysis
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

-- Table access patterns
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;
```

## 🛠️ Database Utilities

### **Backup Scripts**

```bash
#!/bin/bash
# Database backup script

# Set variables
DB_NAME="your_database_name"
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
pg_dump $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

### **Restore Script**

```bash
#!/bin/bash
# Database restore script

# Set variables
DB_NAME="your_database_name"
BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Restore database
if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c $BACKUP_FILE | psql $DB_NAME
else
    psql $DB_NAME < $BACKUP_FILE
fi

echo "Database restored from: $BACKUP_FILE"
```

## 📊 Data Migration Scripts

### **Schema Migration Template**

```sql
-- Migration: Add new column to existing table
-- Version: 2024.01.01
-- Description: Add new field to user_profiles table

BEGIN;

-- Add new column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Create index for new column
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone_number
ON user_profiles(phone_number);

-- Update existing records with default values
UPDATE user_profiles
SET phone_number = 'Not provided'
WHERE phone_number IS NULL;

-- Commit transaction
COMMIT;
```

### **Data Migration Script**

```sql
-- Data migration: Update existing data
-- Version: 2024.01.02
-- Description: Migrate old data format to new format

BEGIN;

-- Example: Update status values
UPDATE applications
SET status = 'under_review'
WHERE status = 'pending'
AND created_at < '2024-01-01';

-- Example: Migrate data from one table to another
INSERT INTO ai_matching_sessions (user_id, opportunity_id, matching_score)
SELECT
  user_id,
  opportunity_id,
  0.5 -- Default score
FROM applications
WHERE status = 'approved'
AND NOT EXISTS (
  SELECT 1 FROM ai_matching_sessions
  WHERE user_id = applications.user_id
  AND opportunity_id = applications.opportunity_id
);

COMMIT;
```

## 🔍 Database Debugging Tools

### **Common Debugging Queries**

```sql
-- Check table structure
\d table_name

-- Check all tables
\dt

-- Check indexes
\di

-- Check constraints
\d+ table_name

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'table_name';

-- Check active connections
SELECT * FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Check table sizes
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

### **Performance Debugging**

```sql
-- Enable query logging
SET log_statement = 'all';
SET log_min_duration_statement = 1000; -- Log queries taking > 1 second

-- Check slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE mean_time > 1000 -- Queries taking > 1 second on average
ORDER BY mean_time DESC;

-- Check table bloat
SELECT
  schemaname,
  tablename,
  n_dead_tup,
  n_live_tup,
  round(n_dead_tup::numeric / (n_live_tup + n_dead_tup) * 100, 2) as dead_percent
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
ORDER BY dead_percent DESC;
```

This comprehensive database guide provides everything needed to understand, set up, and maintain the R/HOOD Studio database. It includes schema definitions, security policies, maintenance procedures, and debugging tools for effective database management.
