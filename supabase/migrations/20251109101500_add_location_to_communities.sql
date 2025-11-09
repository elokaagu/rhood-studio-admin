-- Add location metadata to communities
ALTER TABLE public.communities
ADD COLUMN IF NOT EXISTS location text NOT NULL DEFAULT 'Global';

UPDATE public.communities
SET location = 'Global'
WHERE location IS NULL;

