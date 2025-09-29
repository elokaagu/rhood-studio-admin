-- Enable RLS on actual tables only (excluding all views)
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Applications - Users can view and create their own applications
CREATE POLICY "Users can view their own applications" 
ON public.applications 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own applications" 
ON public.applications 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own applications" 
ON public.applications 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Communities - Public read, authenticated users can create
CREATE POLICY "Anyone can view communities" 
ON public.communities 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create communities" 
ON public.communities 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Community creators can update their communities" 
ON public.communities 
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by);

-- Community Members - Users can view memberships and manage their own
CREATE POLICY "Anyone can view community memberships" 
ON public.community_members 
FOR SELECT 
USING (true);

CREATE POLICY "Users can join communities" 
ON public.community_members 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership" 
ON public.community_members 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" 
ON public.community_members 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Messages - Users can only access their own messages
CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their sent messages" 
ON public.messages 
FOR UPDATE 
TO authenticated
USING (auth.uid() = sender_id);

-- Notifications - Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Opportunities - Public read, organizers can manage their own
CREATE POLICY "Anyone can view active opportunities" 
ON public.opportunities 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can create opportunities" 
ON public.opportunities 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their own opportunities" 
ON public.opportunities 
FOR UPDATE 
TO authenticated
USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their own opportunities" 
ON public.opportunities 
FOR DELETE 
TO authenticated
USING (auth.uid() = organizer_id);

-- User Profiles - Public read, users can manage their own
CREATE POLICY "Anyone can view user profiles" 
ON public.user_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);