import { supabase } from "@/integrations/supabase/client";
import { formatDate, formatTimeRange } from "@/lib/date-utils";
import { getCurrentUserId, getCurrentUserProfile } from "@/lib/auth-utils";

export type OpportunityDetailView = {
  id: string;
  title: string;
  location: string;
  date: string;
  timeRange: string;
  pay: string;
  applicants: number;
  /** Badge key: archived | active | closed | completed | draft */
  displayStatus: string;
  is_archived: boolean;
  is_active: boolean | null;
  listing_status: string | null;
  genre: string | null;
  description: string;
  short_summary: string;
  requirements: string | null;
  additionalInfo: string;
  image_url: string | null;
  /** Event window ended (by end time) but row not archived — UI only, no DB write */
  eventPastDue: boolean;
  hasAcceptedApplication: boolean;
};

function normalizeId(id: unknown, fallback: string): string {
  if (typeof id === "string") return id;
  if (typeof id === "number") return String(id);
  return fallback;
}

function displayStatusFromRow(row: {
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

type OpportunityRow = {
  id: string;
  title: string;
  location: string;
  event_date: string | null;
  event_end_time: string | null;
  payment: number | null;
  genre: string | null;
  description: string;
  skill_level: string | null;
  image_url: string | null;
  is_active: boolean | null;
  is_archived: boolean | null;
  listing_status: string | null;
  organizer_id: string | null;
  additional_info?: string | null;
  short_summary?: string | null;
};

/**
 * Loads one opportunity with applicant count and acceptance flag for the current user.
 * Does not write to the database. Brand users only receive their own opportunities.
 */
export async function fetchOpportunityDetails(
  opportunityId: string
): Promise<
  | { ok: true; detail: OpportunityDetailView }
  | { ok: false; message: string; reason: "not_found" | "forbidden" | "error" }
> {
  const userProfile = await getCurrentUserProfile();
  const userId = await getCurrentUserId();

  let query = supabase
    .from("opportunities")
    .select("*")
    .eq("id", opportunityId);

  if (userProfile?.role === "brand" && userId) {
    query = query.eq("organizer_id", userId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === "PGRST116") {
      return {
        ok: false,
        message: "Opportunity not found.",
        reason: "not_found",
      };
    }
    return {
      ok: false,
      message: error.message || "Failed to load opportunity.",
      reason: "error",
    };
  }

  if (!data) {
    return {
      ok: false,
      message: "Opportunity not found.",
      reason: "not_found",
    };
  }

  const row = data as OpportunityRow;

  if (userProfile?.role === "brand" && userId && row.organizer_id !== userId) {
    return {
      ok: false,
      message: "You can only view your own opportunities.",
      reason: "forbidden",
    };
  }

  const now = new Date();
  const eventEndCandidate = row.event_end_time
    ? new Date(row.event_end_time)
    : row.event_date
      ? new Date(row.event_date)
      : null;
  const eventPastDue =
    !!eventEndCandidate &&
    !isNaN(eventEndCandidate.getTime()) &&
    eventEndCandidate.getTime() < now.getTime() &&
    !(row.is_archived ?? false);

  let applicantCount = 0;
  const { count, error: countError } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("opportunity_id", row.id);

  if (!countError && typeof count === "number") {
    applicantCount = count;
  }

  let hasAcceptedApplication = false;
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (uid) {
      const { data: appRow } = await supabase
        .from("applications")
        .select("status")
        .eq("opportunity_id", row.id)
        .eq("user_id", uid)
        .eq("status", "approved")
        .maybeSingle();
      hasAcceptedApplication = !!appRow;
    }
  } catch {
    /* ignore */
  }

  const shortSummary =
    (row as { short_summary?: string | null }).short_summary ??
    (row.description ? row.description.substring(0, 300) : "");

  const detail: OpportunityDetailView = {
    id: normalizeId(row.id, opportunityId),
    title: row.title,
    location: row.location,
    date: row.event_date ? formatDate(row.event_date) : "Unknown",
    timeRange: formatTimeRange(row.event_date, row.event_end_time),
    pay: row.payment != null ? `£${row.payment}` : "N/A",
    applicants: applicantCount,
    displayStatus: displayStatusFromRow(row),
    is_archived: row.is_archived ?? false,
    is_active: row.is_active,
    listing_status: row.listing_status,
    genre: row.genre,
    description: row.description,
    short_summary: shortSummary,
    requirements: row.skill_level,
    additionalInfo: row.additional_info?.trim() ?? "",
    image_url: row.image_url,
    eventPastDue,
    hasAcceptedApplication,
  };

  return { ok: true, detail };
}

/** Explicit user action — not called during read/load. */
export async function updateOpportunityArchiveState(
  opportunityId: string,
  shouldArchive: boolean
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await supabase
    .from("opportunities")
    .update({
      is_archived: shouldArchive,
      is_active: shouldArchive ? false : true,
    })
    .eq("id", opportunityId);

  if (error) {
    return { ok: false, message: error.message || "Update failed." };
  }
  return { ok: true };
}

export async function deleteOpportunityById(
  opportunityId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await supabase
    .from("opportunities")
    .delete()
    .eq("id", opportunityId);

  if (error) {
    return { ok: false, message: error.message || "Delete failed." };
  }
  return { ok: true };
}
