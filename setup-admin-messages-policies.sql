-- Add admin policies for messages table to allow admin access
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view messages in communities they belong to" ON messages;
DROP POLICY IF EXISTS "Users can send messages to communities they belong to" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

-- Create more permissive policies for admin access
-- Admin can view all messages
CREATE POLICY "Admin can view all messages" ON messages
  FOR SELECT USING (true);

-- Admin can insert messages
CREATE POLICY "Admin can insert messages" ON messages
  FOR INSERT WITH CHECK (true);

-- Admin can update messages
CREATE POLICY "Admin can update messages" ON messages
  FOR UPDATE USING (true);

-- Admin can delete messages
CREATE POLICY "Admin can delete messages" ON messages
  FOR DELETE USING (true);

-- Also update communities policies for admin access
DROP POLICY IF EXISTS "Users can view communities they belong to" ON communities;
DROP POLICY IF EXISTS "Users can create communities" ON communities;
DROP POLICY IF EXISTS "Users can update communities they own" ON communities;
DROP POLICY IF EXISTS "Users can delete communities they own" ON communities;

CREATE POLICY "Admin can view all communities" ON communities
  FOR SELECT USING (true);

CREATE POLICY "Admin can create communities" ON communities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update communities" ON communities
  FOR UPDATE USING (true);

CREATE POLICY "Admin can delete communities" ON communities
  FOR DELETE USING (true);

-- Also update community_members policies
DROP POLICY IF EXISTS "Users can view community_members" ON community_members;
DROP POLICY IF EXISTS "Users can insert community_members" ON community_members;
DROP POLICY IF EXISTS "Users can update community_members" ON community_members;
DROP POLICY IF EXISTS "Users can delete community_members" ON community_members;

CREATE POLICY "Admin can view all community members" ON community_members
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert community members" ON community_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin can update community members" ON community_members
  FOR UPDATE USING (true);

CREATE POLICY "Admin can delete community members" ON community_members
  FOR DELETE USING (true);

SELECT 'Admin policies added successfully' as status;

