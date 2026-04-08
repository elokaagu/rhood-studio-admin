import { getDisplayText } from "@/lib/text-utils";
import { supabase } from "@/integrations/supabase/client";

export const OPPORTUNITY_DESCRIPTION_MAX_LENGTH = 700;

export type OpportunityFormState = {
  title: string;
  description: string;
  location: string;
  locationPlaceId: string;
  dateType: "single" | "range";
  date: string;
  endDate: string;
  time: string;
  endTime: string;
  pay: string;
  genre: string;
  requirements: string;
  additionalInfo: string;
  status: string;
  imageUrl: string;
  archived: boolean;
};

export type OpportunitySaveMode = "publish" | "draft";

export function validateOpportunityForm(
  form: OpportunityFormState
):
  | { ok: true; eventStart: Date; eventEnd: Date }
  | { ok: false; message: string } {
  if (!form.title.trim()) {
    return { ok: false, message: "Please enter a title." };
  }

  if (!form.date || !form.time || !form.endTime) {
    return {
      ok: false,
      message: "Please provide a date, start time, and finish time.",
    };
  }

  if (form.dateType === "range" && !form.endDate) {
    return {
      ok: false,
      message: "Please provide an end date for the campaign range.",
    };
  }

  if (form.dateType === "range" && form.endDate < form.date) {
    return {
      ok: false,
      message: "End date must be on or after the start date.",
    };
  }

  const eventStart = new Date(`${form.date}T${form.time}`);
  let eventEnd: Date;

  if (form.dateType === "range") {
    eventEnd = new Date(`${form.endDate}T${form.endTime}`);
  } else {
    eventEnd = new Date(`${form.date}T${form.endTime}`);
  }

  if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
    return {
      ok: false,
      message: "Please enter a valid start and finish time.",
    };
  }

  if (eventEnd <= eventStart) {
    return {
      ok: false,
      message: "Finish time must be after the start time.",
    };
  }

  if (!form.location.trim()) {
    return {
      ok: false,
      message: "Please choose a location for this opportunity.",
    };
  }

  return { ok: true, eventStart, eventEnd };
}

export function processOpportunityDescription(raw: string): string {
  return getDisplayText(raw.trim()).slice(0, OPPORTUNITY_DESCRIPTION_MAX_LENGTH);
}

function parsePaymentAmount(pay: string): number | null {
  if (!pay.trim()) return null;
  const n = parseFloat(pay.replace(/[£,]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Builds the row payload for `opportunities.update`.
 * `is_active` remains the legacy app flag: true only for published Active + not archived.
 */
export function buildOpportunityUpdatePayload(
  form: OpportunityFormState,
  validated: { eventStart: Date; eventEnd: Date },
  mode: OpportunitySaveMode,
  processedDescription: string
) {
  const paymentAmount = parsePaymentAmount(form.pay);

  const listingStatus = mode === "draft" ? "draft" : form.status;

  const isActive =
    mode === "publish" &&
    form.status === "active" &&
    !form.archived;

  return {
    title: form.title.trim(),
    description: processedDescription,
    location: form.location.trim(),
    event_date: validated.eventStart.toISOString(),
    event_end_time: validated.eventEnd.toISOString(),
    payment: paymentAmount,
    genre: form.genre,
    skill_level: form.requirements.trim() || null,
    additional_info: form.additionalInfo.trim() || null,
    listing_status: listingStatus,
    is_active: isActive,
    is_archived: form.archived,
    image_url: form.imageUrl || null,
  };
}

export type OpportunityUpdatePayload = ReturnType<
  typeof buildOpportunityUpdatePayload
>;

/** Persists the built row to `opportunities` (single update call). */
export async function saveOpportunity(
  opportunityId: string,
  payload: OpportunityUpdatePayload
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await supabase
    .from("opportunities")
    .update(payload)
    .eq("id", opportunityId);

  if (error) {
    return { ok: false, message: error.message || "Failed to save." };
  }
  return { ok: true };
}

type OpportunityRow = {
  title: string;
  description: string;
  location: string;
  event_date: string | null;
  event_end_time: string | null;
  payment: number | null;
  genre: string | null;
  skill_level: string | null;
  image_url: string | null;
  is_active: boolean | null;
  is_archived: boolean | null;
  additional_info?: string | null;
  listing_status?: string | null;
};

/** Map DB row → form state for the edit screen (no demo fallback). */
export function opportunityRowToFormState(
  data: OpportunityRow
): OpportunityFormState {
  const eventDate = data.event_date ? new Date(data.event_date) : null;
  const dateStr = eventDate ? eventDate.toISOString().split("T")[0] : "";
  const timeStr = eventDate
    ? eventDate.toTimeString().split(" ")[0].substring(0, 5)
    : "";

  const eventEnd = data.event_end_time ? new Date(data.event_end_time) : null;
  const endTimeStr = eventEnd
    ? eventEnd.toTimeString().split(" ")[0].substring(0, 5)
    : "";
  const endDateStr = eventEnd ? eventEnd.toISOString().split("T")[0] : "";

  const isRange =
    !!eventDate &&
    !!eventEnd &&
    dateStr !== endDateStr &&
    !isNaN(eventDate.getTime()) &&
    !isNaN(eventEnd.getTime());

  const listing = data.listing_status?.trim();
  const statusUi =
    listing && ["draft", "active", "closed", "completed"].includes(listing)
      ? listing
      : data.is_archived
        ? "draft"
        : data.is_active
          ? "active"
          : "closed";

  return {
    title: data.title || "",
    description: (data.description || "").slice(0, OPPORTUNITY_DESCRIPTION_MAX_LENGTH),
    location: data.location || "",
    locationPlaceId: "",
    dateType: isRange ? "range" : "single",
    date: dateStr,
    endDate: isRange ? endDateStr : "",
    time: timeStr,
    endTime: endTimeStr,
    pay: data.payment != null ? data.payment.toString() : "",
    genre: data.genre || "",
    requirements: data.skill_level || "",
    additionalInfo: data.additional_info?.trim() ?? "",
    status: statusUi,
    imageUrl: data.image_url || "",
    archived: data.is_archived ?? false,
  };
}
