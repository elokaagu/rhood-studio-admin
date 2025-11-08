-- Add end time metadata for opportunities while keeping backward compatibility
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS event_end_time timestamptz;

-- Allow opportunities to stay live until explicitly deactivated
ALTER TABLE public.opportunities
ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false;


