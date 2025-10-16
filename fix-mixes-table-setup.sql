-- Fix mixes table setup - handles existing policies
-- Run this SQL in your Supabase SQL Editor

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can view all mixes" ON mixes;
DROP POLICY IF EXISTS "Admins can insert mixes" ON mixes;
DROP POLICY IF EXISTS "Admins can update mixes" ON mixes;
DROP POLICY IF EXISTS "Admins can delete mixes" ON mixes;

-- Create policies for admin access
CREATE POLICY "Admins can view all mixes" ON mixes
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert mixes" ON mixes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update mixes" ON mixes
  FOR UPDATE USING (true);

CREATE POLICY "Admins can delete mixes" ON mixes
  FOR DELETE USING (true);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'mixes'
ORDER BY policyname;
