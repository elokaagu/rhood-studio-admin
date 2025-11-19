-- RLS Policies for Brand Portal Access Control
-- Brands can only manage their own opportunities and applications

-- Opportunities: Brands can only see and manage their own opportunities
CREATE POLICY "Brands can view their own opportunities" 
ON public.opportunities 
FOR SELECT 
TO authenticated
USING (
  -- Admins can see all
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Brands can only see their own
  organizer_id = auth.uid()
);

CREATE POLICY "Brands can insert their own opportunities" 
ON public.opportunities 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Admins can insert any
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Brands can only insert with their own organizer_id
  organizer_id = auth.uid()
);

CREATE POLICY "Brands can update their own opportunities" 
ON public.opportunities 
FOR UPDATE 
TO authenticated
USING (
  -- Admins can update any
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Brands can only update their own
  organizer_id = auth.uid()
)
WITH CHECK (
  -- Admins can update any
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Brands can only update their own
  organizer_id = auth.uid()
);

CREATE POLICY "Brands can delete their own opportunities" 
ON public.opportunities 
FOR DELETE 
TO authenticated
USING (
  -- Admins can delete any
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Brands can only delete their own
  organizer_id = auth.uid()
);

-- Applications: Brands can only see and manage applications for their own opportunities
CREATE POLICY "Brands can view applications for their opportunities" 
ON public.applications 
FOR SELECT 
TO authenticated
USING (
  -- Admins can see all
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Users can see their own applications
  user_id = auth.uid()
  OR
  -- Brands can see applications for their opportunities
  EXISTS (
    SELECT 1 FROM opportunities 
    WHERE opportunities.id = applications.opportunity_id 
    AND opportunities.organizer_id = auth.uid()
  )
);

CREATE POLICY "Brands can update applications for their opportunities" 
ON public.applications 
FOR UPDATE 
TO authenticated
USING (
  -- Admins can update any
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Users can update their own applications
  user_id = auth.uid()
  OR
  -- Brands can update applications for their opportunities
  EXISTS (
    SELECT 1 FROM opportunities 
    WHERE opportunities.id = applications.opportunity_id 
    AND opportunities.organizer_id = auth.uid()
  )
)
WITH CHECK (
  -- Admins can update any
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Users can update their own applications
  user_id = auth.uid()
  OR
  -- Brands can update applications for their opportunities
  EXISTS (
    SELECT 1 FROM opportunities 
    WHERE opportunities.id = applications.opportunity_id 
    AND opportunities.organizer_id = auth.uid()
  )
);

-- Application form responses: Brands can only see and manage responses for their opportunities
CREATE POLICY "Brands can view form responses for their opportunities" 
ON public.application_form_responses 
FOR SELECT 
TO authenticated
USING (
  -- Admins can see all
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Users can see their own responses
  user_id = auth.uid()
  OR
  -- Brands can see responses for their opportunities
  EXISTS (
    SELECT 1 FROM opportunities 
    WHERE opportunities.id = application_form_responses.opportunity_id 
    AND opportunities.organizer_id = auth.uid()
  )
);

CREATE POLICY "Brands can update form responses for their opportunities" 
ON public.application_form_responses 
FOR UPDATE 
TO authenticated
USING (
  -- Admins can update any
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Users can update their own responses
  user_id = auth.uid()
  OR
  -- Brands can update responses for their opportunities
  EXISTS (
    SELECT 1 FROM opportunities 
    WHERE opportunities.id = application_form_responses.opportunity_id 
    AND opportunities.organizer_id = auth.uid()
  )
)
WITH CHECK (
  -- Admins can update any
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  OR
  -- Users can update their own responses
  user_id = auth.uid()
  OR
  -- Brands can update responses for their opportunities
  EXISTS (
    SELECT 1 FROM opportunities 
    WHERE opportunities.id = application_form_responses.opportunity_id 
    AND opportunities.organizer_id = auth.uid()
  )
);

