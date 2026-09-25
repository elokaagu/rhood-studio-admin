-- Brands can only read their own booking_requests, so the Book a DJ page could
-- not see other brands' bookings and showed almost every DJ as available.
-- This returns counts only (no booking details) for the requested DJs.
CREATE OR REPLACE FUNCTION public.dj_upcoming_booking_counts(p_dj_ids uuid[])
RETURNS TABLE (dj_id uuid, upcoming integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT br.dj_id, COUNT(*)::integer
  FROM public.booking_requests br
  WHERE br.dj_id = ANY (p_dj_ids)
    AND br.status IN ('pending', 'accepted')
    AND br.event_date >= now()
  GROUP BY br.dj_id
$$;

REVOKE ALL ON FUNCTION public.dj_upcoming_booking_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dj_upcoming_booking_counts(uuid[]) TO authenticated;

NOTIFY pgrst, 'reload schema';
