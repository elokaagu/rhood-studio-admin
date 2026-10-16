import { supabase } from "@/integrations/supabase/client";

type RatingRow = {
  ratee_id: string | null;
  stars: number | null;
};

function fromUntyped(table: string) {
  return (supabase as unknown as { from: (name: string) => any }).from(table);
}

/** Average brand→DJ star ratings (`dj_rating`) keyed by DJ user id. */
export function averageDjRatings(
  rows: RatingRow[]
): Map<string, number> {
  const sums = new Map<string, { total: number; n: number }>();
  for (const row of rows) {
    if (!row.ratee_id || row.stars == null) continue;
    const cur = sums.get(row.ratee_id) ?? { total: 0, n: 0 };
    cur.total += row.stars;
    cur.n += 1;
    sums.set(row.ratee_id, cur);
  }
  const out = new Map<string, number>();
  for (const [id, { total, n }] of sums) {
    out.set(id, Math.round((total / n) * 10) / 10);
  }
  return out;
}

export async function fetchDjRatingAverages(
  userIds?: string[]
): Promise<Map<string, number>> {
  let query = fromUntyped("ratings")
    .select("ratee_id, stars")
    .eq("rating_type", "dj_rating");
  if (userIds && userIds.length > 0) {
    query = query.in("ratee_id", userIds);
  }
  const { data, error } = await query;
  if (error) {
    // Table missing or RLS — treat as no ratings rather than break the page.
    console.warn("[ratings]", error.message);
    return new Map();
  }
  return averageDjRatings((data ?? []) as RatingRow[]);
}

export async function fetchDjRatingAverage(
  userId: string
): Promise<number> {
  const map = await fetchDjRatingAverages([userId]);
  return map.get(userId) ?? 0;
}
