-- Update the active opportunity policy so that only explicitly archived items are hidden
DROP POLICY IF EXISTS "Anyone can view active opportunities" ON public.opportunities;

CREATE POLICY "Anyone can view live opportunities"
ON public.opportunities
FOR SELECT
USING (
  is_active AND COALESCE(is_archived, false) = false
);


