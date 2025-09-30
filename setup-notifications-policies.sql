-- Add admin policies for creating notifications
-- Run this SQL in your Supabase SQL Editor

-- Allow admins to create notifications for users
CREATE POLICY "Admins can create notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow admins to view all notifications (for debugging/monitoring)
CREATE POLICY "Admins can view all notifications" 
ON public.notifications 
FOR SELECT 
TO authenticated
USING (true);

-- Allow admins to delete notifications (for cleanup)
CREATE POLICY "Admins can delete notifications" 
ON public.notifications 
FOR DELETE 
TO authenticated
USING (true);

-- Note: The existing policies for users to view and update their own notifications
-- are already in place from the migration file.
