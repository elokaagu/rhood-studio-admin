-- Add short_summary field to opportunities table
-- This is the public summary visible to DJs before they apply
-- The full brief (description) is only visible after acceptance

ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS short_summary TEXT;

-- Add comment to clarify usage
COMMENT ON COLUMN public.opportunities.short_summary IS 'Public summary visible to all DJs before applying. Full brief (description) is only visible after application is accepted.';

-- Create index for search functionality
CREATE INDEX IF NOT EXISTS idx_opportunities_short_summary ON public.opportunities USING gin(to_tsvector('english', COALESCE(short_summary, '')));
