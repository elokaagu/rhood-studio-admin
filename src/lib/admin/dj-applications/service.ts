import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/date-utils";
import type {
  DjApplication,
  DjMembershipSource,
  DjMembershipStatus,
  FetchDjApplicationsResult,
} from "./types";

const PROFILE_COLUMNS =
  "id, first_name, last_name, dj_name, email, city, genres, bio, instagram, soundcloud, profile_image_url, role, created_at, membership_status, membership_source, membership_reviewed_at";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  dj_name: string | null;
  email: string | null;
  city: string | null;
  genres: string[] | null;
  bio: string | null;
  instagram: string | null;
  soundcloud: string | null;
  profile_image_url: string | null;
  role: string | null;
  created_at: string | null;
  membership_status?: string | null;
  membership_source?: string | null;
  membership_reviewed_at?: string | null;
};

function rpcUntyped(fn: string, args?: Record<string, unknown>) {
  return (
    supabase as unknown as {
      rpc: (fn: string, args?: Record<string, unknown>) => any;
    }
  ).rpc(fn, args);
}

function parseStatus(value: string | null | undefined): DjMembershipStatus {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

function parseSource(value: string | null | undefined): DjMembershipSource | null {
  if (
    value === "invite" ||
    value === "invite_code" ||
    value === "application" ||
    value === "existing" ||
    value === "staff"
  ) {
    return value;
  }
  return null;
}

function toDisplayName(row: ProfileRow): string {
  const fullName = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
  return row.dj_name || fullName || row.email || "Unknown DJ";
}

function rowToApplication(row: ProfileRow): DjApplication {
  return {
    id: row.id,
    name: toDisplayName(row),
    djName: row.dj_name,
    email: row.email ?? "Unknown",
    city: row.city,
    genres: row.genres ?? [],
    bio: row.bio,
    profileImageUrl: row.profile_image_url,
    instagram: row.instagram,
    soundcloud: row.soundcloud,
    appliedAt: row.created_at ?? "",
    appliedAtLabel: row.created_at ? formatDate(row.created_at) : "Unknown",
    membershipStatus: parseStatus(row.membership_status),
    membershipSource: parseSource(row.membership_source),
    reviewedAt: row.membership_reviewed_at ?? null,
  };
}

function isMissingMembershipColumn(message: string | undefined): boolean {
  return !!message && message.toLowerCase().includes("membership_");
}

export async function fetchDjApplications(): Promise<FetchDjApplicationsResult> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(PROFILE_COLUMNS)
    .or("role.is.null,role.eq.dj")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingMembershipColumn(error.message)) {
      return {
        ok: false,
        schemaReady: false,
        message:
          "DJ membership columns are not in the live database yet. Run supabase/migrations/20260910180000_dj_membership_approval.sql.",
      };
    }
    return { ok: false, message: error.message || "Failed to load DJ applications." };
  }

  const rows = (data ?? []) as ProfileRow[];
  return {
    ok: true,
    schemaReady: true,
    data: rows.map(rowToApplication),
  };
}

export async function countPendingDjApplications(): Promise<number> {
  const { count, error } = await supabase
    .from("user_profiles")
    .select("id", { count: "exact", head: true })
    .or("role.is.null,role.eq.dj")
    .eq("membership_status", "pending");

  if (error) return 0;
  return count ?? 0;
}

export async function setDjMembershipStatus(
  userId: string,
  status: DjMembershipStatus,
  source?: DjMembershipSource | null
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await rpcUntyped("admin_set_dj_membership", {
    p_user_id: userId,
    p_status: status,
    ...(source ? { p_source: source } : {}),
  });

  if (error) {
    return {
      ok: false,
      message: error.message || "Failed to update membership status.",
    };
  }
  return { ok: true };
}

export function membershipSourceLabel(source: DjMembershipSource | null): string {
  switch (source) {
    case "invite":
      return "Admin invite";
    case "invite_code":
      return "Invite code";
    case "application":
      return "App application";
    case "existing":
      return "Existing member";
    case "staff":
      return "Staff";
    default:
      return "Unknown";
  }
}
