-- Create invite_codes table for brand registration
-- Admins can generate invite codes that brands use to sign up

CREATE TABLE IF NOT EXISTS public.invite_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  brand_name TEXT NOT NULL,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  used_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_by ON invite_codes(created_by);
CREATE INDEX IF NOT EXISTS idx_invite_codes_used_by ON invite_codes(used_by);
CREATE INDEX IF NOT EXISTS idx_invite_codes_is_active ON invite_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires_at ON invite_codes(expires_at);

-- Enable Row Level Security
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Admins can view all invite codes
CREATE POLICY "Admins can view all invite codes" 
ON public.invite_codes 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Admins can create invite codes
CREATE POLICY "Admins can create invite codes" 
ON public.invite_codes 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
  AND created_by = auth.uid()
);

-- Admins can update invite codes
CREATE POLICY "Admins can update invite codes" 
ON public.invite_codes 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Anyone can check if an invite code is valid (for signup validation)
CREATE POLICY "Anyone can check invite code validity" 
ON public.invite_codes 
FOR SELECT 
USING (
  is_active = true 
  AND (expires_at IS NULL OR expires_at > NOW())
  AND used_by IS NULL
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_invite_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invite_codes_updated_at 
  BEFORE UPDATE ON invite_codes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_invite_codes_updated_at();

