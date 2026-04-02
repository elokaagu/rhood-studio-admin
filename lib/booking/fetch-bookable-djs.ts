import { supabase } from "@/integrations/supabase/client";
import type { BookableDJ } from "@/lib/booking/bookable-dj";

type RawProfile = Record<string, unknown> & {
  id: string;
  dj_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  city?: string | null;
  genres?: string[] | null;
  bio?: string | null;
  instagram?: string | null;
  soundcloud?: string | null;
  profile_image_url?: string | null;
  credits?: number | null;
};

type MixRow = {
  id: string;
  title: string | null;
  genre: string | null;
  file_url: string | null;
  description: string | null;
  uploaded_by: string | null;
  created_at: string | null;
};

function averageRatingByUser(
  rows: { user_id: string | null; rating: number | null }[]
): Map<string, number> {
  const sums = new Map<string, { total: number; n: number }>();
  for (const row of rows) {
    if (!row.user_id || row.rating == null) continue;
    const cur = sums.get(row.user_id) ?? { total: 0, n: 0 };
    cur.total += row.rating;
    cur.n += 1;
    sums.set(row.user_id, cur);
  }
  const out = new Map<string, number>();
  sums.forEach((v, uid) => {
    out.set(uid, Math.round((v.total / v.n) * 10) / 10);
  });
  return out;
}

function latestMixAndCounts(mixes: MixRow[]): {
  latestByUser: Map<string, NonNullable<BookableDJ["latestMix"]>>;
  countByUser: Map<string, number>;
} {
  const countByUser = new Map<string, number>();
  for (const m of mixes) {
    if (!m.uploaded_by) continue;
    countByUser.set(m.uploaded_by, (countByUser.get(m.uploaded_by) ?? 0) + 1);
  }

  const sorted = [...mixes].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  });

  const latestByUser = new Map<string, NonNullable<BookableDJ["latestMix"]>>();
  for (const m of sorted) {
    if (!m.uploaded_by || !m.file_url || latestByUser.has(m.uploaded_by)) continue;
    latestByUser.set(m.uploaded_by, {
      id: m.id,
      title: m.title || "",
      genre: m.genre || "",
      file_url: m.file_url,
      description: m.description,
    });
  }

  return { latestByUser, countByUser };
}

/** Upcoming booking count → same heuristic as legacy page: 3+ = busy, else available. */
function availabilityFromUpcomingCount(n: number): "available" | "busy" {
  if (n >= 3) return "busy";
  return "available";
}

/**
 * Loads DJ profiles and enriches with batched queries (no per-DJ N+1).
 */
export async function fetchBookableDjs(): Promise<BookableDJ[]> {
  // Non-brands only; avoid chaining .or(...).neq("role","brand") (redundant).
  const { data: profiles, error: profilesError } = await supabase
    .from("user_profiles")
    .select("*")
    .or("role.is.null,role.neq.brand");

  if (profilesError) throw profilesError;

  const list = (profiles || []) as RawProfile[];
  if (list.length === 0) return [];

  const ids = list.map((p) => p.id);
  const nowIso = new Date().toISOString();

  const [feedbackRes, mixesRes, bookingsRes] = await Promise.all([
    supabase.from("ai_matching_feedback").select("user_id, rating").in("user_id", ids),
    supabase
      .from("mixes")
      .select("id, title, genre, file_url, description, uploaded_by, created_at")
      .in("uploaded_by", ids)
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
    supabase
      .from("booking_requests")
      .select("dj_id")
      .in("dj_id", ids)
      .in("status", ["pending", "accepted"])
      .gte("event_date", nowIso),
  ]);

  const ratingByUser = averageRatingByUser(
    (feedbackRes.data ?? []) as { user_id: string | null; rating: number | null }[]
  );

  const { latestByUser, countByUser } = latestMixAndCounts((mixesRes.data ?? []) as MixRow[]);

  const upcomingCountByDj = new Map<string, number>();
  for (const row of bookingsRes.data ?? []) {
    const id = row.dj_id as string | null;
    if (!id) continue;
    upcomingCountByDj.set(id, (upcomingCountByDj.get(id) ?? 0) + 1);
  }

  const result: BookableDJ[] = list.map((profile) => {
    const rating = ratingByUser.get(profile.id) ?? 0;
    const mixCount = countByUser.get(profile.id) ?? 0;
    const latestMix = latestByUser.get(profile.id) ?? null;
    const credits = (profile.credits as number) || 0;
    const upcoming = upcomingCountByDj.get(profile.id) ?? 0;
    const availability = availabilityFromUpcomingCount(upcoming);

    return {
      id: profile.id,
      dj_name: profile.dj_name || "",
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      email: profile.email || "",
      city: profile.city || "",
      genres: profile.genres || [],
      bio: profile.bio ?? null,
      instagram: profile.instagram ?? null,
      soundcloud: profile.soundcloud ?? null,
      profile_image_url: profile.profile_image_url ?? null,
      rating,
      mixCount,
      credits,
      latestMix,
      availability,
    };
  });

  result.sort((a, b) => b.credits - a.credits);
  return result;
}

/** Public URL for an approved mix audio file in the `mixes` storage bucket. */
export function getMixPublicUrl(filePath: string): string {
  return supabase.storage.from("mixes").getPublicUrl(filePath).data.publicUrl;
}
