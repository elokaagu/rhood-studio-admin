/** Stored listing_status values stay the same; these are the Portal labels. */
export const LISTING_STATUS_LABELS: Record<string, string> = {
  pending: "Submit for review",
  active: "Publish to app",
  draft: "Draft",
  closed: "Closed",
  completed: "Completed",
  archived: "Archived",
};

export function listingStatusLabel(status: string | null | undefined): string {
  const key = (status || "").trim().toLowerCase();
  if (!key) return "";
  return LISTING_STATUS_LABELS[key] || status || "";
}
