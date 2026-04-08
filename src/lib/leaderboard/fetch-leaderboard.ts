import { supabase } from "@/integrations/supabase/client";

export type LeaderboardEntry = {
  user_id: string;
  dj_name: string | null;
  brand_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  total_credits: number;
  rank_position: number;
  role: string | null;
};

export type FetchLeaderboardResult =
  | { ok: true; entries: LeaderboardEntry[] }
  | { ok: false; message: string };

function profilesTable() {
  return (supabase as unknown as { from: (name: string) => any }).from(
    "user_profiles"
  );
}

function txTable() {
  return (supabase as unknown as { from: (name: string) => any }).from(
    "credit_transactions"
  );
}

type ProfileRow = {
  id: string;
  dj_name: string | null;
  brand_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  credits: number | null;
  role: string | null;
};

/**
 * DJ credits leaderboard: excludes brands. DJs and admins with credits may appear;
 * admins are labeled in the UI.
 */
export async function fetchLeaderboardAllTime(): Promise<FetchLeaderboardResult> {
  const { data: profiles, error } = await profilesTable()
    .select(
      "id, dj_name, brand_name, first_name, last_name, email, credits, role"
    )
    .neq("role", "brand")
    .order("credits", { ascending: false, nullsFirst: false })
    .limit(100);

  if (error) {
    if (
      error.code === "42703" ||
      (typeof error.message === "string" &&
        error.message.includes('column "credits" does not exist'))
    ) {
      return {
        ok: false,
        message:
          "Credits column is not available yet. Run the credits migration in Supabase.",
      };
    }
    if (error.code === "PGRST205") {
      return {
        ok: false,
        message:
          "Schema cache error. Refresh the page in a few minutes or contact an administrator.",
      };
    }
    return {
      ok: false,
      message: error.message || "Failed to load leaderboard.",
    };
  }

  const rows = (profiles ?? []) as ProfileRow[];
  const valid = rows.filter((p) => (p.credits ?? 0) > 0 && p.role !== "brand");

  const entries: LeaderboardEntry[] = valid.map((profile, index) => ({
    user_id: profile.id,
    dj_name: profile.dj_name,
    brand_name: profile.brand_name,
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
    total_credits: profile.credits ?? 0,
    rank_position: index + 1,
    role: profile.role ?? null,
  }));

  return { ok: true, entries };
}

/**
 * Ranks users by sum of positive credit_transactions amounts in the calendar year.
 */
export async function fetchLeaderboardForYear(
  year: number
): Promise<FetchLeaderboardResult> {
  const start = `${year}-01-01T00:00:00.000Z`;
  const end = `${year + 1}-01-01T00:00:00.000Z`;

  const { data: txs, error: txError } = await txTable()
    .select("user_id, amount")
    .gte("created_at", start)
    .lt("created_at", end)
    .gt("amount", 0);

  if (txError) {
    if (txError.code === "42P01" || txError.code === "PGRST205") {
      return {
        ok: false,
        message:
          "Credit transactions are not available. Run credits migrations or try all-time view.",
      };
    }
    return {
      ok: false,
      message: txError.message || "Failed to load year leaderboard.",
    };
  }

  const sums = new Map<string, number>();
  for (const row of txs ?? []) {
    const uid = (row as { user_id: string }).user_id;
    const amount = Number((row as { amount: number }).amount) || 0;
    if (!uid || amount <= 0) continue;
    sums.set(uid, (sums.get(uid) ?? 0) + amount);
  }

  const sortedIds = Array.from(sums.entries())
    .filter(([, total]) => total > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 100)
    .map(([id]) => id);

  if (sortedIds.length === 0) {
    return { ok: true, entries: [] };
  }

  const { data: profiles, error: profileError } = await profilesTable()
    .select("id, dj_name, brand_name, first_name, last_name, email, role")
    .in("id", sortedIds);

  if (profileError) {
    return {
      ok: false,
      message: profileError.message || "Failed to load profiles for leaderboard.",
    };
  }

  const byId = new Map(
    ((profiles ?? []) as ProfileRow[]).map((p) => [p.id, p])
  );

  const entries: LeaderboardEntry[] = sortedIds
    .map((id) => {
      const profile = byId.get(id);
      if (!profile || profile.role === "brand") return null;
      const total = sums.get(id) ?? 0;
      return {
        user_id: profile.id,
        dj_name: profile.dj_name,
        brand_name: profile.brand_name,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        total_credits: total,
        rank_position: 0,
        role: profile.role ?? null,
      };
    })
    .filter((e): e is LeaderboardEntry => e !== null);

  entries.forEach((e, i) => {
    e.rank_position = i + 1;
  });

  return { ok: true, entries };
}

export function leaderboardDisplayName(entry: LeaderboardEntry): string {
  return (
    entry.dj_name ||
    entry.brand_name ||
    `${entry.first_name || ""} ${entry.last_name || ""}`.trim() ||
    entry.email
  );
}
