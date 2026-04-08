import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/date-utils";
import { deleteAdminMemberAction } from "@/actions/admin-members";
import type { DjMember, DjSortBy, FetchDjsResult } from "./types";

const ACTIVE_DAYS_THRESHOLD = 30;

function getSortOrder(sortBy: DjSortBy): {
  column: "created_at" | "updated_at";
  ascending: boolean;
} {
  switch (sortBy) {
    case "date_joined_oldest":
      return { column: "created_at", ascending: true };
    case "last_active_newest":
      return { column: "updated_at", ascending: false };
    case "last_active_oldest":
      return { column: "updated_at", ascending: true };
    case "date_joined_newest":
    default:
      return { column: "created_at", ascending: false };
  }
}

function toDisplayName(row: {
  dj_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
}): string {
  const fullName = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
  return row.dj_name || fullName || row.email || "Unknown User";
}

function toStatusFromUpdatedAt(updatedAt: string | null): "active" | "inactive" {
  if (!updatedAt) return "inactive";
  const updated = new Date(updatedAt).getTime();
  if (Number.isNaN(updated)) return "inactive";
  const now = Date.now();
  const days = (now - updated) / (1000 * 60 * 60 * 24);
  return days <= ACTIVE_DAYS_THRESHOLD ? "active" : "inactive";
}

function applicationsTable() {
  return (supabase as unknown as { from: (name: string) => any }).from("applications");
}

export async function fetchDjs(sortBy: DjSortBy): Promise<FetchDjsResult> {
  const sort = getSortOrder(sortBy);
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "id, first_name, last_name, dj_name, email, city, genres, bio, instagram, soundcloud, profile_image_url, role, created_at, updated_at"
    )
    .or("role.is.null,role.neq.brand")
    .order(sort.column, { ascending: sort.ascending });

  if (error) {
    return { ok: false, message: error.message || "Failed to fetch DJs." };
  }

  const rows = (data ?? []) as Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    dj_name: string | null;
    email: string;
    city: string | null;
    genres: string[] | null;
    bio: string | null;
    instagram: string | null;
    soundcloud: string | null;
    profile_image_url: string | null;
    created_at: string | null;
    updated_at: string | null;
  }>;

  const userIds = rows.map((r) => r.id);

  const [ratingRes, appRes] = await Promise.all([
    userIds.length
      ? supabase
          .from("ai_matching_feedback")
          .select("user_id, rating")
          .in("user_id", userIds)
      : Promise.resolve({ data: [], error: null } as any),
    userIds.length
      ? applicationsTable().select("user_id, status, gig_completed").in("user_id", userIds)
      : Promise.resolve({ data: [], error: null } as any),
  ]);

  const ratingRows = (ratingRes.data ?? []) as Array<{ user_id: string; rating: number | null }>;
  const ratingMap = new Map<string, { total: number; count: number }>();
  for (const row of ratingRows) {
    const current = ratingMap.get(row.user_id) ?? { total: 0, count: 0 };
    ratingMap.set(row.user_id, {
      total: current.total + (row.rating ?? 0),
      count: current.count + 1,
    });
  }

  const appRows = (appRes.data ?? []) as Array<{
    user_id: string;
    status?: string | null;
    gig_completed?: boolean | null;
  }>;
  const gigsMap = new Map<string, number>();
  for (const row of appRows) {
    const isCompleted = row.status === "approved" && !!row.gig_completed;
    if (!isCompleted) continue;
    gigsMap.set(row.user_id, (gigsMap.get(row.user_id) ?? 0) + 1);
  }

  const members: DjMember[] = rows.map((row) => {
    const displayName = toDisplayName(row);
    const ratingStats = ratingMap.get(row.id);
    const avgRating =
      ratingStats && ratingStats.count > 0
        ? Math.round((ratingStats.total / ratingStats.count) * 10) / 10
        : 0;

    return {
      id: row.id,
      name: displayName,
      email: row.email ?? "Unknown",
      location: row.city ?? "Unknown",
      joinedDate: row.created_at ? formatDate(row.created_at) : "Unknown",
      gigs: gigsMap.get(row.id) ?? 0,
      rating: avgRating,
      genres: row.genres ?? [],
      status: toStatusFromUpdatedAt(row.updated_at),
      lastActive: row.updated_at ? formatDate(row.updated_at) : "Unknown",
      djName: row.dj_name,
      bio: row.bio,
      instagram: row.instagram,
      soundcloud: row.soundcloud,
      profileImageUrl: row.profile_image_url,
    };
  });

  return { ok: true, data: members };
}

export async function deleteDj(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
  return deleteAdminMemberAction(id);
}
