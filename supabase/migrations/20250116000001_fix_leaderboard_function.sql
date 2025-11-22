-- Fix leaderboard function to ensure it's accessible and properly defined
-- This migration ensures the function exists and can be called correctly

-- Drop the function if it exists with wrong signature
DROP FUNCTION IF EXISTS get_credits_leaderboard(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_credits_leaderboard(p_limit INTEGER, p_year INTEGER);
DROP FUNCTION IF EXISTS get_credits_leaderboard(p_year INTEGER, p_limit INTEGER);

-- Recreate the function with correct signature
CREATE OR REPLACE FUNCTION get_credits_leaderboard(
  p_year INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  user_id UUID,
  dj_name TEXT,
  brand_name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  total_credits INTEGER,
  rank_position BIGINT
) AS $$
DECLARE
  v_start_date TIMESTAMP WITH TIME ZONE;
  v_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- If year is specified, filter by year
  IF p_year IS NOT NULL THEN
    v_start_date := make_date(p_year, 1, 1);
    v_end_date := make_date(p_year, 12, 31) + interval '1 day' - interval '1 second';
    
    RETURN QUERY
    WITH yearly_credits AS (
      SELECT 
        ct.user_id,
        SUM(ct.amount)::INTEGER as total
      FROM credit_transactions ct
      WHERE ct.created_at >= v_start_date
        AND ct.created_at <= v_end_date
        AND ct.amount > 0 -- Only count earned credits, not spent
      GROUP BY ct.user_id
    )
    SELECT 
      up.id as user_id,
      up.dj_name,
      up.brand_name,
      up.first_name,
      up.last_name,
      up.email,
      COALESCE(yc.total, COALESCE(up.credits, 0))::INTEGER as total_credits,
      ROW_NUMBER() OVER (ORDER BY COALESCE(yc.total, COALESCE(up.credits, 0)) DESC) as rank_position
    FROM user_profiles up
    LEFT JOIN yearly_credits yc ON up.id = yc.user_id
    WHERE (up.role IS NULL OR up.role != 'admin') -- Exclude admins from leaderboard
      AND (yc.total IS NOT NULL OR COALESCE(up.credits, 0) > 0) -- Only show users with credits
    ORDER BY COALESCE(yc.total, COALESCE(up.credits, 0)) DESC
    LIMIT p_limit;
  ELSE
    -- All-time leaderboard
    RETURN QUERY
    SELECT 
      up.id as user_id,
      up.dj_name,
      up.brand_name,
      up.first_name,
      up.last_name,
      up.email,
      COALESCE(up.credits, 0)::INTEGER as total_credits,
      ROW_NUMBER() OVER (ORDER BY COALESCE(up.credits, 0) DESC) as rank_position
    FROM user_profiles up
    WHERE (up.role IS NULL OR up.role != 'admin') -- Exclude admins
      AND COALESCE(up.credits, 0) > 0
    ORDER BY COALESCE(up.credits, 0) DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_credits_leaderboard(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_credits_leaderboard(INTEGER, INTEGER) TO anon;

-- Add comment to help with debugging
COMMENT ON FUNCTION get_credits_leaderboard(INTEGER, INTEGER) IS 
  'Returns the credits leaderboard for a given year (or all-time if year is NULL). Parameters: p_year (INTEGER, optional), p_limit (INTEGER, default 100)';

