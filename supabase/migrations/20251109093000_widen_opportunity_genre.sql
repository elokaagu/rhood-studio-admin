-- Allow storing multiple genres without truncation
ALTER TABLE public.opportunities
  ALTER COLUMN genre TYPE text;

