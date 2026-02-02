-- Bug + Friction Log - single feedback system so nothing gets lost
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'confusing', 'slow', 'unclear')),
  severity TEXT NOT NULL CHECK (severity IN ('stopper', 'annoying', 'minor')),
  where_it_happens TEXT,
  steps_to_reproduce TEXT,
  screenshot_link TEXT,
  owner_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'to_do' CHECK (status IN ('to_do', 'in_progress', 'done')),
  submitted_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_severity ON feedback(severity);
CREATE INDEX IF NOT EXISTS idx_feedback_submitted_by ON feedback(submitted_by);
CREATE INDEX IF NOT EXISTS idx_feedback_owner_id ON feedback(owner_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can submit feedback
CREATE POLICY "Authenticated users can submit feedback" ON feedback
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = submitted_by);

-- Submitters can view their own feedback; admins can view all (via service role or admin check in app)
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT TO authenticated
  USING (auth.uid() = submitted_by);

-- Allow admins to view all - we'll use a policy that allows read if user is admin (check in app or RPC)
-- For simplicity: allow all authenticated to read (so admins see all in app; we filter by role in UI)
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;
CREATE POLICY "Authenticated users can view all feedback" ON feedback
  FOR SELECT TO authenticated
  USING (true);

-- Submitter or owner can update; admins can update any (e.g. status / owner)
CREATE POLICY "Submitters and owners can update feedback" ON feedback
  FOR UPDATE TO authenticated
  USING (auth.uid() = submitted_by OR auth.uid() = owner_id)
  WITH CHECK (auth.uid() = submitted_by OR auth.uid() = owner_id);

CREATE POLICY "Admins can update any feedback" ON feedback
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only admins should delete - we don't allow delete via RLS for regular users; admins use service role
-- So no DELETE policy for authenticated = no one can delete via anon key (safe)

CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();

SELECT 'Feedback table created successfully' AS status;
