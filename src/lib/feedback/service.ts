import { supabase } from "@/integrations/supabase/client";

export type FeedbackType = "bug" | "confusing" | "slow" | "unclear";
export type FeedbackSeverity = "stopper" | "annoying" | "minor";
export type FeedbackStatus = "to_do" | "in_progress" | "done";

export type FeedbackUser = {
  first_name?: string;
  last_name?: string;
  email?: string;
};

export type FeedbackItem = {
  id: string;
  issue_title: string;
  type: FeedbackType;
  severity: FeedbackSeverity;
  where_it_happens: string | null;
  steps_to_reproduce: string | null;
  screenshot_link: string | null;
  owner_id: string | null;
  status: FeedbackStatus;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;
  submitter?: FeedbackUser;
  owner?: FeedbackUser;
};

export const TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "confusing", label: "Confusing" },
  { value: "slow", label: "Slow" },
  { value: "unclear", label: "Unclear" },
];

export const SEVERITY_OPTIONS: { value: FeedbackSeverity; label: string }[] = [
  { value: "stopper", label: "Stopper" },
  { value: "annoying", label: "Annoying" },
  { value: "minor", label: "Minor" },
];

export const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: "to_do", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

function normalizeType(input: string | null | undefined): FeedbackType {
  const value = (input ?? "").trim().toLowerCase();
  if (value === "bug") return "bug";
  if (value === "slow") return "slow";
  if (value === "unclear") return "unclear";
  if (value === "confusing") return "confusing";
  return "bug";
}

function normalizeSeverity(input: string | null | undefined): FeedbackSeverity {
  const value = (input ?? "").trim().toLowerCase();
  if (value === "stopper") return "stopper";
  if (value === "minor") return "minor";
  if (value === "annoying") return "annoying";
  return "annoying";
}

function normalizeStatus(input: string | null | undefined): FeedbackStatus {
  const value = (input ?? "").trim().toLowerCase().replace(/[-\s]/g, "_");
  if (value === "done") return "done";
  if (value === "in_progress") return "in_progress";
  if (value === "todo" || value === "to_do") return "to_do";
  return "to_do";
}

function mapRow(row: any): FeedbackItem {
  return {
    id: String(row.id),
    issue_title: String(row.issue_title ?? "Untitled"),
    type: normalizeType(row.type),
    severity: normalizeSeverity(row.severity),
    where_it_happens: row.where_it_happens ?? null,
    steps_to_reproduce: row.steps_to_reproduce ?? null,
    screenshot_link: row.screenshot_link ?? null,
    owner_id: row.owner_id ?? null,
    status: normalizeStatus(row.status),
    submitted_by: row.submitted_by ?? null,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
    submitter: row.submitter ?? undefined,
    owner: row.owner ?? undefined,
  };
}

export async function listFeedback(params: {
  isAdmin: boolean;
  userId: string | null;
}): Promise<{ ok: true; items: FeedbackItem[] } | { ok: false; message: string }> {
  let query = (supabase as any)
    .from("feedback")
    .select(
      `
        *,
        submitter:user_profiles!feedback_submitted_by_fkey(first_name, last_name, email),
        owner:user_profiles!feedback_owner_id_fkey(first_name, last_name, email)
      `
    )
    .order("created_at", { ascending: false });

  if (!params.isAdmin && params.userId) {
    query = query.eq("submitted_by", params.userId);
  }

  const { data, error } = await query;
  if (error) {
    if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
      return { ok: true, items: [] };
    }
    return { ok: false, message: error.message || "Failed to load feedback" };
  }

  return { ok: true, items: ((data ?? []) as any[]).map(mapRow) };
}

export async function submitFeedback(params: {
  userId: string;
  issue_title: string;
  type: FeedbackType;
  severity: FeedbackSeverity;
  where_it_happens: string;
  steps_to_reproduce: string;
  screenshot_link: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await (supabase as any).from("feedback").insert([
    {
      issue_title: params.issue_title.trim(),
      type: normalizeType(params.type),
      severity: normalizeSeverity(params.severity),
      where_it_happens: params.where_it_happens.trim() || null,
      steps_to_reproduce: params.steps_to_reproduce.trim() || null,
      screenshot_link: params.screenshot_link.trim() || null,
      submitted_by: params.userId,
      status: "to_do",
    },
  ]);

  if (error) {
    return { ok: false, message: error.message || "Failed to submit feedback" };
  }

  return { ok: true };
}

export async function updateFeedbackStatus(params: {
  id: string;
  status: FeedbackStatus;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await (supabase as any)
    .from("feedback")
    .update({ status: normalizeStatus(params.status) })
    .eq("id", params.id);

  if (error) {
    return { ok: false, message: error.message || "Failed to update status" };
  }

  return { ok: true };
}
