import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId, getCurrentUserProfile } from "@/lib/auth-utils";

function rawBoosts() {
  return (supabase as unknown as { from: (t: string) => any }).from(
    "opportunity_boosts"
  );
}

export type OpportunityListItem = {
  id: string;
  title: string;
  location: string;
  event_date: string | null;
  event_end_time: string | null;
  payment: number | null;
  genre: string | null;
  description: string | null;
  image_url: string | null;
  created_at: string | null;
  is_archived: boolean;
  is_active: boolean | null;
  listing_status: string | null;
  applicants: number;
  hasBoost: boolean;
  boostCount: number;
  userBoost: {
    id: string;
    user_id: string;
    boost_expires_at: string;
  } | null;
  /** Badge / filter key */
  status: string;
  /** Event window ended, not archived — informational only (no DB write) */
  eventPastDue: boolean;
};

function deriveStatus(row: {
  is_archived: boolean | null;
  is_active: boolean | null;
  listing_status: string | null;
}): string {
  if (row.is_archived) return "archived";
  const ls = row.listing_status?.trim();
  if (ls === "completed") return "completed";
  if (ls === "closed") return "closed";
  if (ls === "draft") return "draft";
  if (ls === "active") return "active";
  return row.is_active ? "active" : "draft";
}

function normalizeId(id: unknown): string {
  if (typeof id === "string") return id;
  if (typeof id === "number") return String(id);
  return "";
}

async function applicantCountsByOpportunity(
  ids: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;

  const { data, error } = await supabase
    .from("applications")
    .select("opportunity_id")
    .in("opportunity_id", ids);

  if (error || !data) return map;

  for (const row of data as { opportunity_id: string | null }[]) {
    const oid = row.opportunity_id;
    if (!oid) continue;
    map.set(oid, (map.get(oid) ?? 0) + 1);
  }
  return map;
}

async function fetchActiveBoostsForOpportunities(ids: string[]): Promise<
  Map<
    string,
    {
      rows: Array<{
        id: string;
        user_id: string;
        boost_expires_at: string;
      }>;
    }
  >
> {
  const map = new Map<
    string,
    {
      rows: Array<{
        id: string;
        user_id: string;
        boost_expires_at: string;
      }>;
    }
  >();
  if (ids.length === 0) return map;

  const now = new Date().toISOString();
  const { data, error } = await rawBoosts()
    .select("id, opportunity_id, user_id, boost_expires_at")
    .in("opportunity_id", ids)
    .eq("is_active", true)
    .gte("boost_expires_at", now);

  if (error || !data) return map;

  for (const row of data as Array<{
    id: string;
    opportunity_id: string;
    user_id: string;
    boost_expires_at: string;
  }>) {
    const oid = row.opportunity_id;
    if (!map.has(oid)) {
      map.set(oid, { rows: [] });
    }
    map.get(oid)!.rows.push({
      id: row.id,
      user_id: row.user_id,
      boost_expires_at: row.boost_expires_at,
    });
  }
  return map;
}

/**
 * Read-only list aggregation: opportunities + applicant counts + boost metadata.
 * Does not auto-archive or otherwise mutate rows.
 */
export async function fetchAdminOpportunitiesList(): Promise<
  | {
      ok: true;
      items: OpportunityListItem[];
      userCredits: number;
      userRole: string | null;
    }
  | { ok: false; message: string }
> {
  const userProfile = await getCurrentUserProfile();
  const userId = await getCurrentUserId();
  const userRole = userProfile?.role ?? null;

  let userCredits = 0;
  if (
    userId &&
    userProfile?.role !== "brand" &&
    userProfile?.role !== "admin"
  ) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("credits")
      .eq("id", userId)
      .single();
    const ext = profile as { credits?: number } | null;
    if (ext && typeof ext.credits === "number") {
      userCredits = ext.credits;
    }
  }

  let query = supabase.from("opportunities").select("*");
  if (userProfile?.role === "brand" && userId) {
    query = query.eq("organizer_id", userId);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    return { ok: false, message: error.message || "Failed to load opportunities." };
  }

  const rows = (data ?? []) as Array<{
    id: string | number;
    title: string;
    location: string;
    event_date: string | null;
    event_end_time: string | null;
    payment: number | null;
    genre: string | null;
    description: string | null;
    image_url: string | null;
    created_at: string | null;
    is_archived: boolean | null;
    is_active: boolean | null;
    listing_status: string | null;
  }>;

  const ids = rows.map((r) => normalizeId(r.id)).filter(Boolean);

  const [countMap, boostMap] = await Promise.all([
    applicantCountsByOpportunity(ids),
    fetchActiveBoostsForOpportunities(ids),
  ]);

  const now = new Date();

  const items: OpportunityListItem[] = rows.map((row) => {
    const id = normalizeId(row.id);
    const endDate = row.event_end_time
      ? new Date(row.event_end_time)
      : row.event_date
        ? new Date(row.event_date)
        : null;
    const isArchived = row.is_archived ?? false;
    const eventPastDue =
      !!endDate &&
      !isNaN(endDate.getTime()) &&
      endDate.getTime() < now.getTime() &&
      !isArchived;

    const boostInfo = boostMap.get(id);
    const boostRows = boostInfo?.rows ?? [];
    const hasBoost = boostRows.length > 0;
    const boostCount = boostRows.length;
    const userBoost = userId
      ? boostRows.find((b) => b.user_id === userId) ?? null
      : null;

    return {
      id,
      title: row.title,
      location: row.location,
      event_date: row.event_date,
      event_end_time: row.event_end_time,
      payment: row.payment,
      genre: row.genre,
      description: row.description,
      image_url: row.image_url,
      created_at: row.created_at,
      is_archived: isArchived,
      is_active: row.is_active,
      listing_status: row.listing_status,
      applicants: countMap.get(id) ?? 0,
      hasBoost,
      boostCount,
      userBoost,
      status: deriveStatus(row),
      eventPastDue,
    };
  });

  items.sort((a, b) => {
    if (a.hasBoost && !b.hasBoost) return -1;
    if (!a.hasBoost && b.hasBoost) return 1;
    if (a.hasBoost && b.hasBoost && b.boostCount !== a.boostCount) {
      return b.boostCount - a.boostCount;
    }
    const aT = new Date(a.created_at || 0).getTime();
    const bT = new Date(b.created_at || 0).getTime();
    return bT - aT;
  });

  return { ok: true, items, userCredits, userRole };
}

/** Numeric pay for sorting / filters */
export function paySortValue(item: OpportunityListItem): number {
  const v = item.payment;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  return 0;
}
