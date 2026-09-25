import { getDisplayText } from "@/lib/text-utils";
import { normalizeWebsiteUrl } from "@/lib/opportunities/website";
import { parseNumericCompensation } from "@/lib/opportunities/compensation";
import {
  INVOICE_CURRENCY,
  isOrderCurrency,
  orderValueColumns,
  orderValueError,
} from "@/lib/opportunities/order-value";
import {
  isOvernightSpan,
  parseEventDateTime,
  resolveEndAfterStart,
  wallClockInZone,
} from "@/lib/opportunities/event-times";
import { isValidTimeZone, resolveTimeZone } from "@/lib/opportunities/timezones";
import {
  maxApprovalsFromForm,
  formFromMaxApprovals,
  type ApprovalLimitMode,
} from "@/lib/opportunities/approval-limit";
import {
  persistMaxApprovals,
  withoutMaxApprovals,
  writeOpportunity,
} from "@/lib/opportunities/write-opportunity";

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
  noEndDate: boolean;
  website: string;
  timezone: string;
  approvalLimit: ApprovalLimitMode;
  approvalLimitCount: number;
  orderValue: string;
  orderCurrency: string;
  orderFxRate: number | null;
  orderFxDate: string | null;
};

export type OpportunitySaveMode = "publish" | "draft";

export function validateOpportunityForm(
  form: OpportunityFormState
):
  | { ok: true; eventStart: Date; eventEnd: Date | null }
  | { ok: false; message: string } {
  if (!form.title.trim()) {
    return { ok: false, message: "Please enter a title." };
  }

  const orderError = orderValueError(form);
  if (orderError) return { ok: false, message: orderError };

  if (!form.date || !form.time) {
    return {
      ok: false,
      message: "Please provide a start date and start time.",
    };
  }

  const noEndDate = form.dateType === "range" && form.noEndDate;

  if (!noEndDate && !form.endTime) {
    return {
      ok: false,
      message: "Please provide a date, start time, and finish time.",
    };
  }

  if (form.dateType === "range" && !noEndDate && !form.endDate) {
    return {
      ok: false,
      message:
        "Please provide an end date for the campaign range, or mark it as ongoing.",
    };
  }

  if (form.dateType === "range" && !noEndDate && form.endDate < form.date) {
    return {
      ok: false,
      message: "End date must be on or after the start date.",
    };
  }

  const timezone = form.timezone?.trim() || resolveTimeZone();
  const eventStart = parseEventDateTime(form.date, form.time, timezone);
  if (isNaN(eventStart.getTime())) {
    return { ok: false, message: "Please enter a valid start date and time." };
  }

  if (noEndDate) {
    return { ok: true, eventStart, eventEnd: null };
  }

  let eventEnd =
    form.dateType === "range"
      ? parseEventDateTime(form.endDate, form.endTime, timezone)
      : parseEventDateTime(form.date, form.endTime, timezone);

  if (isNaN(eventEnd.getTime())) {
    return {
      ok: false,
      message: "Please enter a valid start and finish time.",
    };
  }

  eventEnd = resolveEndAfterStart(eventStart, eventEnd, timezone);

  if (eventEnd.getTime() <= eventStart.getTime()) {
    return {
      ok: false,
      message: "Finish time must be after the start time.",
    };
  }

  return { ok: true, eventStart, eventEnd };
}

export function processOpportunityDescription(raw: string): string {
  return getDisplayText(raw.trim()).slice(0, OPPORTUNITY_DESCRIPTION_MAX_LENGTH);
}

function parsePaymentAmount(pay: string): number | null {
  return parseNumericCompensation(pay);
}

/**
 * Builds the row payload for `opportunities.update`.
 * `is_active` remains the legacy app flag: true only for published Active + not archived.
 */
export function buildOpportunityUpdatePayload(
  form: OpportunityFormState,
  validated: { eventStart: Date; eventEnd: Date | null },
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
    location: form.location.trim() || "",
    compensation: form.pay.trim() || null,
    event_date: validated.eventStart.toISOString(),
    event_start_time: validated.eventStart.toISOString(),
    event_end_time: validated.eventEnd
      ? validated.eventEnd.toISOString()
      : null,
    event_timezone: form.timezone?.trim() || resolveTimeZone(),
    max_approvals: maxApprovalsFromForm(
      form.approvalLimit,
      form.approvalLimitCount
    ),
    payment: paymentAmount,
    genre: form.genre,
    skill_level: form.requirements.trim() || null,
    additional_info: form.additionalInfo.trim() || null,
    listing_status: listingStatus,
    is_active: isActive,
    is_archived: form.archived,
    image_url: form.imageUrl || null,
    website: normalizeWebsiteUrl(form.website),
    ...orderValueColumns(form),
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
  const { body, maxApprovals } = withoutMaxApprovals({
    ...(payload as Record<string, unknown>),
  });
  const { error } = await writeOpportunity(body, "update", opportunityId);

  if (error) {
    return { ok: false, message: error.message || "Failed to save." };
  }

  await persistMaxApprovals(opportunityId, maxApprovals);
  return { ok: true };
}

type OpportunityRow = {
  title: string;
  description: string;
  location: string;
  event_date: string | null;
  event_end_time: string | null;
  event_timezone?: string | null;
  payment: number | null;
  genre: string | null;
  skill_level: string | null;
  image_url: string | null;
  is_active: boolean | null;
  is_archived: boolean | null;
  additional_info?: string | null;
  listing_status?: string | null;
  website?: string | null;
  compensation?: string | null;
  max_approvals?: number | null;
  order_value?: number | string | null;
  order_value_original?: number | string | null;
  order_currency?: string | null;
  fx_rate_to_gbp?: number | string | null;
  fx_rate_date?: string | null;
};

/** Map DB row → form state for the edit screen (no demo fallback). */
export function opportunityRowToFormState(
  data: OpportunityRow
): OpportunityFormState {
  const storedZone = data.event_timezone?.trim() || "";
  const timezone =
    storedZone && isValidTimeZone(storedZone) ? storedZone : resolveTimeZone();
  const approval = formFromMaxApprovals(data.max_approvals);
  const eventDate = data.event_date ? new Date(data.event_date) : null;
  const startWall =
    eventDate && !isNaN(eventDate.getTime())
      ? wallClockInZone(eventDate, timezone)
      : { date: "", time: "" };

  const eventEnd = data.event_end_time ? new Date(data.event_end_time) : null;
  const endWall =
    eventEnd && !isNaN(eventEnd.getTime())
      ? wallClockInZone(eventEnd, timezone)
      : { date: "", time: "" };

  const noEndDate = !!eventDate && !eventEnd;
  const overnight =
    !!eventDate &&
    !!eventEnd &&
    !isNaN(eventDate.getTime()) &&
    !isNaN(eventEnd.getTime()) &&
    isOvernightSpan(eventDate, eventEnd, timezone);
  const isRange =
    noEndDate ||
    (!!eventDate &&
      !!eventEnd &&
      startWall.date !== endWall.date &&
      !overnight &&
      !isNaN(eventDate.getTime()) &&
      !isNaN(eventEnd.getTime()));

  const listing = data.listing_status?.trim();
  const statusUi =
    listing &&
    ["pending", "draft", "active", "closed", "completed"].includes(listing)
      ? listing
      : data.is_archived
        ? "draft"
        : data.is_active
          ? "active"
          : "pending";

  return {
    title: data.title || "",
    description: (data.description || "").slice(0, OPPORTUNITY_DESCRIPTION_MAX_LENGTH),
    location: data.location || "",
    locationPlaceId: "",
    dateType: isRange ? "range" : "single",
    date: startWall.date,
    endDate: isRange ? endWall.date : "",
    time: startWall.time,
    endTime: endWall.time,
    pay: data.compensation?.trim() || (data.payment != null ? data.payment.toString() : ""),
    genre: data.genre || "",
    requirements: data.skill_level || "",
    additionalInfo: data.additional_info?.trim() ?? "",
    status: statusUi,
    imageUrl: data.image_url || "",
    archived: data.is_archived ?? false,
    noEndDate,
    website: data.website?.trim() ?? "",
    timezone,
    approvalLimit: approval.mode,
    approvalLimitCount: approval.count,
    ...storedOrderForm(data),
  };
}

function storedOrderForm(data: OpportunityRow) {
  const currency = isOrderCurrency(data.order_currency)
    ? data.order_currency
    : INVOICE_CURRENCY;
  const original = data.order_value_original ?? data.order_value;
  const rate = data.fx_rate_to_gbp != null ? Number(data.fx_rate_to_gbp) : null;
  return {
    orderValue: original != null ? String(Number(original)) : "",
    orderCurrency: currency,
    orderFxRate:
      currency === INVOICE_CURRENCY ? 1 : rate && rate > 0 ? rate : null,
    orderFxDate: data.fx_rate_date ?? null,
  };
}
