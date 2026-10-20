-- One source of truth for a DJ's "gigs completed" and star rating.
--
-- Gigs are completed in two places:
--   * applications.gig_completed (portal Applications → "Mark gig as done"),
--     rated in public.ratings
--   * public.gigs.status = 'completed' (gig records, rated in gigs.dj_rating)
-- Approving an application also creates a gigs row for the same
-- (dj, opportunity), so the two are de-duplicated on that pair.

CREATE OR REPLACE FUNCTION public.recompute_dj_gig_stats(p_dj_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed integer;
  v_rating numeric;
BEGIN
  IF p_dj_id IS NULL THEN
    RETURN;
  END IF;

  WITH done AS (
    SELECT g.opportunity_id, g.id AS gig_id
    FROM public.gigs g
    WHERE g.dj_id = p_dj_id AND g.status = 'completed'
    UNION ALL
    SELECT a.opportunity_id, NULL::uuid
    FROM public.applications a
    WHERE a.user_id = p_dj_id
      AND COALESCE(a.status, '') = 'approved'
      AND COALESCE(a.gig_completed, false)
      AND NOT EXISTS (
        SELECT 1 FROM public.gigs g
        WHERE g.dj_id = p_dj_id
          AND g.status = 'completed'
          AND g.opportunity_id IS NOT DISTINCT FROM a.opportunity_id
          AND a.opportunity_id IS NOT NULL
      )
  )
  SELECT count(*)::integer INTO v_completed FROM done;

  WITH stars AS (
    SELECT r.stars::numeric AS s
    FROM public.ratings r
    WHERE r.ratee_id = p_dj_id AND r.rating_type = 'dj_rating'
    UNION ALL
    SELECT g.dj_rating
    FROM public.gigs g
    WHERE g.dj_id = p_dj_id
      AND g.status = 'completed'
      AND g.dj_rating > 0
      AND NOT EXISTS (
        SELECT 1
        FROM public.ratings r
        JOIN public.applications a ON a.id = r.application_id
        WHERE r.ratee_id = p_dj_id
          AND r.rating_type = 'dj_rating'
          AND a.opportunity_id IS NOT NULL
          AND a.opportunity_id = g.opportunity_id
      )
  )
  SELECT round(avg(s), 1) INTO v_rating FROM stars;

  UPDATE public.user_profiles
  SET gigs_completed = v_completed,
      rating = COALESCE(v_rating, 0),
      updated_at = now()
  WHERE id = p_dj_id;
END;
$$;

REVOKE ALL ON FUNCTION public.recompute_dj_gig_stats(uuid) FROM PUBLIC, anon, authenticated;

-- Applications: replace the applications-only recount.
CREATE OR REPLACE FUNCTION public.sync_gigs_completed_from_applications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_dj_gig_stats(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Gigs: the old BEFORE trigger did "+1" and averaged only gigs.dj_rating,
-- which drifted from the applications recount. Keep its completed_at stamp,
-- recount AFTER the row is written.
CREATE OR REPLACE FUNCTION public.update_user_stats_on_gig_complete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    NEW.completed_at = COALESCE(NEW.completed_at, now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_dj_stats_from_gigs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.dj_id IS DISTINCT FROM NEW.dj_id THEN
    PERFORM public.recompute_dj_gig_stats(OLD.dj_id);
  END IF;
  PERFORM public.recompute_dj_gig_stats(COALESCE(NEW.dj_id, OLD.dj_id));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_dj_stats_from_gigs ON public.gigs;
CREATE TRIGGER trigger_sync_dj_stats_from_gigs
AFTER INSERT OR DELETE OR UPDATE OF status, dj_rating, dj_id ON public.gigs
FOR EACH ROW EXECUTE FUNCTION public.sync_dj_stats_from_gigs();

CREATE OR REPLACE FUNCTION public.sync_dj_stats_from_ratings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.rating_type, OLD.rating_type) = 'dj_rating' THEN
    PERFORM public.recompute_dj_gig_stats(COALESCE(NEW.ratee_id, OLD.ratee_id));
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_dj_stats_from_ratings ON public.ratings;
CREATE TRIGGER trigger_sync_dj_stats_from_ratings
AFTER INSERT OR DELETE OR UPDATE OF stars, ratee_id ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.sync_dj_stats_from_ratings();

-- Portal: mark a gig record done and rate the DJ in one step.
-- Allowed for admins and the brand that owns the gig's opportunity.
CREATE OR REPLACE FUNCTION public.complete_gig_and_rate(
  p_gig_id uuid,
  p_stars integer,
  p_comment text DEFAULT NULL
)
RETURNS public.gigs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_gig public.gigs;
  v_is_owner boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;
  IF p_stars IS NULL OR p_stars < 1 OR p_stars > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5 stars';
  END IF;

  SELECT lower(coalesce(role, '')) INTO v_role
  FROM public.user_profiles WHERE id = v_uid;

  SELECT * INTO v_gig FROM public.gigs WHERE id = p_gig_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gig not found';
  END IF;

  IF v_gig.opportunity_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = v_gig.opportunity_id
        AND (o.organizer_id = v_uid OR o.created_by = v_uid)
    ) INTO v_is_owner;
  END IF;

  IF v_role <> 'admin' AND NOT v_is_owner THEN
    RAISE EXCEPTION 'Only admins or the brand that booked this gig can complete it';
  END IF;
  IF v_gig.dj_id = v_uid THEN
    RAISE EXCEPTION 'You cannot rate your own gig';
  END IF;

  UPDATE public.gigs
  SET status = 'completed',
      dj_rating = p_stars,
      notes = CASE
        WHEN nullif(trim(coalesce(p_comment, '')), '') IS NULL THEN notes
        WHEN nullif(trim(coalesce(notes, '')), '') IS NULL THEN trim(p_comment)
        ELSE notes || E'\n\nRating note: ' || trim(p_comment)
      END
  WHERE id = p_gig_id
  RETURNING * INTO v_gig;

  RETURN v_gig;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_gig_and_rate(uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_gig_and_rate(uuid, integer, text) TO authenticated;

-- Close an access hole: the old policies used
--   EXISTS (... WHERE o.id = gigs.opportunity_id OR o.created_by = auth.uid() ...)
-- which let any signed-in user read and edit every gig linked to an
-- opportunity. Owners must own *that* opportunity.
DROP POLICY IF EXISTS gigs_select_dj_or_organizer ON public.gigs;
CREATE POLICY gigs_select_dj_or_organizer ON public.gigs
  FOR SELECT TO authenticated
  USING (
    dj_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = gigs.opportunity_id
        AND (o.created_by = auth.uid() OR o.organizer_id = auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS gigs_update_dj_or_organizer ON public.gigs;
CREATE POLICY gigs_update_dj_or_organizer ON public.gigs
  FOR UPDATE TO authenticated
  USING (
    dj_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.opportunities o
      WHERE o.id = gigs.opportunity_id
        AND (o.created_by = auth.uid() OR o.organizer_id = auth.uid())
    )
  );

-- DJs may add and edit their own gig records, but only a brand or admin can
-- mark one completed or give it a rating.
CREATE OR REPLACE FUNCTION public.guard_dj_self_rating_on_gigs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR v_uid IS DISTINCT FROM NEW.dj_id THEN
    RETURN NEW;
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = v_uid AND role = 'admin') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'completed' THEN
      NEW.status := 'upcoming';
    END IF;
    NEW.dj_rating := NULL;
  ELSE
    IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed' THEN
      NEW.status := OLD.status;
    END IF;
    NEW.dj_rating := OLD.dj_rating;
  END IF;
  RETURN NEW;
END;
$$;

-- BEFORE triggers run in name order; "a_" keeps this ahead of the
-- completion credit trigger so a blocked self-completion awards nothing.
DROP TRIGGER IF EXISTS a_guard_dj_self_rating_on_gigs ON public.gigs;
CREATE TRIGGER a_guard_dj_self_rating_on_gigs
BEFORE INSERT OR UPDATE ON public.gigs
FOR EACH ROW EXECUTE FUNCTION public.guard_dj_self_rating_on_gigs();

-- Bring every DJ's stored numbers in line with the new rules.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT id FROM public.user_profiles
    WHERE id IN (SELECT dj_id FROM public.gigs)
       OR id IN (SELECT user_id FROM public.applications)
       OR id IN (SELECT ratee_id FROM public.ratings)
       OR COALESCE(gigs_completed, 0) <> 0
       OR COALESCE(rating, 0) <> 0
  LOOP
    PERFORM public.recompute_dj_gig_stats(r.id);
  END LOOP;
END;
$$;
