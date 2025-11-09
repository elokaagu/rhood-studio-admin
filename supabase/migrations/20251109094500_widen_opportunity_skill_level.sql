-- Allow longer text for opportunity requirements
ALTER TABLE public.opportunities
  ALTER COLUMN skill_level TYPE text;

