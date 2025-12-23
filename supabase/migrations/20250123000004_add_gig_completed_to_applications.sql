-- Track completed gigs explicitly on applications
-- Adds a gig_completed flag and defaults existing rows to false.

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS gig_completed BOOLEAN DEFAULT FALSE;

-- Ensure all existing rows are initialized
UPDATE applications SET gig_completed = COALESCE(gig_completed, FALSE);

COMMENT ON COLUMN applications.gig_completed IS 'Marked true when the brand confirms the DJ performed the gig.';
