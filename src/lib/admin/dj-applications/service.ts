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
const PROFILE_COLUMNS_WITHOUT_REVIEW =
  "id, first_name, last_name, dj_name, email, city, genres, bio, instagram, soundcloud, profile_image_url, role, created_at, membership_status, membership_source";
const PROFILE_COLUMNS_CORE =
  "id, first_name, last_name, dj_name, email, city, genres, bio, instagram, soundcloud, profile_image_url, role, created_at";

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

function asProfiles(data: unknown): ProfileRow[] {
  return Array.isArray(data) ? (data as ProfileRow[]) : [];
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

/** Studio historically defaulted new profiles to role=admin, so DJ app
 *  signups are often admin rather than dj. Match the DJs page: anyone
 *  who is not a brand. */
function selectApplicantProfiles(columns: string) {
  return supabase
    .from("user_profiles")
    .select(columns)
    .or("role.is.null,role.neq.brand")
    .order("created_at", { ascending: false });
}

function isQueueRow(row: ProfileRow): boolean {
  const status = parseStatus(row.membership_status);
  if (status === "pending" || status === "rejected") return true;
  return (
    status === "approved" && parseSource(row.membership_source) === "application"
  );
}

export async function fetchDjApplications(): Promise<FetchDjApplicationsResult> {
  const withStatus = await selectApplicantProfiles(PROFILE_COLUMNS_WITHOUT_REVIEW);
  if (!withStatus.error) {
    const withReview = await selectApplicantProfiles(PROFILE_COLUMNS);
    const rows = asProfiles(
      withReview.error ? withStatus.data : withReview.data
    ).filter(isQueueRow);
    return {
      ok: true,
      schemaReady: true,
      data: rows.map(rowToApplication),
    };
  }

  if (!isMissingMembershipColumn(withStatus.error.message)) {
    return {
      ok: false,
      message: withStatus.error.message || "Failed to load DJ applications.",
    };
  }

  const core = await selectApplicantProfiles(PROFILE_COLUMNS_CORE);
  if (core.error) {
    return {
      ok: false,
      schemaReady: false,
      message: core.error.message || "Failed to load DJ applications.",
    };
  }

  return {
    ok: true,
    schemaReady: false,
    data: asProfiles(core.data).filter(isQueueRow).map(rowToApplication),
  };
}

export async function countPendingDjApplications(): Promise<number> {
  const { count, error } = await supabase
    .from("user_profiles")
    .select("id", { count: "exact", head: true })
    .or("role.is.null,role.neq.brand")
    .eq("membership_status", "pending");

  if (error) return 0;
  return count ?? 0;
}

export async function setDjMembershipStatus(
  userId: string,
  status: DjMembershipStatus,
  source?: DjMembershipSource | null
): Promise<{ ok: true } | { ok: false; message: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { ok: false, message: "Not authenticated." };
  }

  try {
    const response = await fetch("/api/admin/dj-membership", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        status,
        source: source ?? "application",
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      return { ok: false, message: payload.error || "Failed to update membership status." };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to update membership status." };
  }
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
