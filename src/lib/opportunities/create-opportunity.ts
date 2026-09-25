import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserProfile } from "@/lib/auth-utils";
import { brandAccountId } from "@/lib/brand/account-scope";
import { getDisplayText } from "@/lib/text-utils";
import { normalizeWebsiteUrl } from "@/lib/opportunities/website";
import { parseNumericCompensation } from "@/lib/opportunities/compensation";
import {
  orderValueColumns,
  orderValueError,
} from "@/lib/opportunities/order-value";
import {
  parseEventDateTime,
  resolveEndAfterStart,
} from "@/lib/opportunities/event-times";
import { isValidTimeZone, resolveTimeZone } from "@/lib/opportunities/timezones";
import { maxApprovalsFromForm } from "@/lib/opportunities/approval-limit";
import type { ApprovalLimitMode } from "@/lib/opportunities/approval-limit";
import {
  orderValueNotSavedWarning,
  persistMaxApprovals,
  withoutMaxApprovals,
  writeOpportunity,
} from "@/lib/opportunities/write-opportunity";

function fromUntyped(table: string) {
  return (supabase as unknown as { from: (name: string) => any }).from(table);
}

export const OPPORTUNITY_DESCRIPTION_MAX_LENGTH = 700;

export type OpportunityCreateMode = "draft" | "publish";

export type OpportunityCreateFormInput = {
  title: string;
  description: string;
  location: string;
  dateType: "single" | "range";
  date: string;
  endDate: string;
  time: string;
  endTime: string;
  pay: string;
  genre: string;
  requirements: string;
  /** Form status: pending | active | closed | draft */
  status: string;
  imageUrl: string;
  noEndDate?: boolean;
  website?: string;
  additionalInfo?: string;
  /** IANA timezone for wall-clock event times. Defaults to the browser zone. */
  timezone?: string;
  approvalLimit?: ApprovalLimitMode;
  approvalLimitCount?: number;
  /** Brand budget before the R/HOOD fee, in `orderCurrency`. */
  orderValue?: string;
  orderCurrency?: string;
  orderFxRate?: number | null;
  orderFxDate?: string | null;
};

export type CreateOpportunityParams = {
  form: OpportunityCreateFormInput;
  selectedGenres: string[];
  mode: OpportunityCreateMode;
  /** Admin posting on behalf of a brand: override organizer_id and organizer_name */
  brandOverride?: { id: string; name: string } | null;
};

export type CreateOpportunityFailure = {
  ok: false;
  toastTitle: string;
  message: string;
};

/** Row returned after insert — extend if callers need more fields from `.select()` */
export type CreatedOpportunity = {
  id: string;
};

export type CreateOpportunitySuccess = {
  ok: true;
  opportunity: CreatedOpportunity;
  warning?: string;
};

export type CreateOpportunityResult =
  | CreateOpportunitySuccess
  | CreateOpportunityFailure;

function fail(
  toastTitle: string,
  message: string
): CreateOpportunityFailure {
  return { ok: false, toastTitle, message };
}

function eventTimezone(form: OpportunityCreateFormInput): string {
  const tz = form.timezone?.trim();
  return tz && isValidTimeZone(tz) ? tz : resolveTimeZone();
}

export function validateOpportunityCreate(
  form: OpportunityCreateFormInput
): CreateOpportunityFailure | null {
  if (!form.date || !form.time) {
    return fail(
      "Missing Schedule",
      "Please provide a start date and start time."
    );
  }

  const orderError = orderValueError(form);
  if (orderError) return fail("Check order value", orderError);

  const noEndDate = form.dateType === "range" && !!form.noEndDate;

  if (!noEndDate && !form.endTime) {
    return fail(
      "Missing Schedule",
      "Please provide a date, start time, and finish time."
    );
  }

  if (form.dateType === "range" && !noEndDate && !form.endDate) {
    return fail(
      "Missing End Date",
      "Please provide an end date for the campaign range, or mark it as ongoing."
    );
  }

  if (form.dateType === "range" && !noEndDate && form.endDate < form.date) {
    return fail(
      "Invalid Date Range",
      "End date must be on or after the start date."
    );
  }

  const timezone = eventTimezone(form);
  const eventStart = parseEventDateTime(form.date, form.time, timezone);
  let eventEnd: Date | null = null;

  if (!noEndDate) {
    if (form.dateType === "range") {
      eventEnd = parseEventDateTime(form.endDate, form.endTime, timezone);
    } else {
      eventEnd = parseEventDateTime(form.date, form.endTime, timezone);
    }

    if (isNaN(eventStart.getTime()) || !eventEnd || isNaN(eventEnd.getTime())) {
      return fail(
        "Invalid Time",
        "Please enter a valid start and finish time."
      );
    }

    eventEnd = resolveEndAfterStart(eventStart, eventEnd, timezone);

    if (eventEnd.getTime() <= eventStart.getTime()) {
      return fail(
        "Invalid Schedule",
        "Finish time must be after the start time."
      );
    }
  } else if (isNaN(eventStart.getTime())) {
    return fail("Invalid Time", "Please enter a valid start date and time.");
  }

  return null;
}

function resolveOrganizerName(
  djName: string | null | undefined,
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallbackEmail: string | undefined
): string {
  const fromDj = djName?.trim();
  if (fromDj) return fromDj;
  const fromName = [firstName, lastName]
    .map((part) => (part ? part.trim() : ""))
    .filter(Boolean)
    .join(" ");
  if (fromName) return fromName;
  if (fallbackEmail) return fallbackEmail.split("@")[0] || "R/HOOD Organizer";
  return "R/HOOD Organizer";
}

export async function createOpportunity(
  params: CreateOpportunityParams
): Promise<CreateOpportunityResult> {
  const { form, selectedGenres, mode, brandOverride } = params;

  const validationError = validateOpportunityCreate(form);
  if (validationError) return validationError;

  const timezone = eventTimezone(form);
  const eventStart = parseEventDateTime(form.date, form.time, timezone);
  const noEndDate = form.dateType === "range" && !!form.noEndDate;
  let eventEnd: Date | null = null;
  if (!noEndDate) {
    eventEnd =
      form.dateType === "range"
        ? parseEventDateTime(form.endDate, form.endTime, timezone)
        : parseEventDateTime(form.date, form.endTime, timezone);
    if (eventEnd && !isNaN(eventEnd.getTime())) {
      eventEnd = resolveEndAfterStart(eventStart, eventEnd, timezone);
    }
  }

  const { error: tableCheckError } = await supabase
    .from("opportunities")
    .select("id")
    .limit(1);

  if (tableCheckError) {
    if (
      tableCheckError.message?.includes("relation") &&
      tableCheckError.message?.includes("does not exist")
    ) {
      return fail(
        "Database Setup Required",
        "Opportunities table doesn't exist. Please create it in Supabase dashboard first."
      );
    }
    return fail(
      "Opportunity Not Saved",
      tableCheckError.message ||
        "Failed to reach the opportunities table. Please try again."
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return fail(
      "Authentication Required",
      "You must be logged in to create an opportunity."
    );
  }

  const userProfile = await getCurrentUserProfile();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name, last_name, dj_name, brand_name")
    .eq("id", user.id)
    .single();

  const organizerName = resolveOrganizerName(
    profile?.dj_name,
    profile?.first_name,
    profile?.last_name,
    user.email ?? undefined
  );

  let organizerId = brandAccountId(userProfile) || user.id;
  if (brandOverride?.id) {
    const { data: brandRow, error: brandScopeError } = await fromUntyped(
      "user_profiles"
    )
      .select("id, brand_account_id")
      .eq("id", brandOverride.id)
      .maybeSingle();
    if (!brandScopeError || !/brand_account_id/i.test(brandScopeError.message || "")) {
      organizerId = brandAccountId(brandRow) || brandOverride.id;
    } else {
      organizerId = brandOverride.id;
    }
  }

  const paymentAmount = parseNumericCompensation(form.pay);
  const compensation = form.pay.trim() || null;

  const genreValue =
    selectedGenres.length > 0
      ? selectedGenres.join(", ")
      : form.genre || null;

  const processedDescription = getDisplayText(form.description.trim()).slice(
    0,
    OPPORTUNITY_DESCRIPTION_MAX_LENGTH
  );

  // "Save Draft" stays hidden as draft. Creating an opportunity defaults to
  // pending (not live) unless the form status is explicitly Active.
  const listingStatus = mode === "draft" ? "draft" : form.status || "pending";
  const isActive = mode === "publish" && listingStatus === "active";

  const insertPayload: Record<string, unknown> = {
    title: form.title.trim(),
    description: processedDescription,
    location: form.location.trim() || "",
    compensation,
    event_date: eventStart.toISOString(),
    event_start_time: eventStart.toISOString(),
    event_end_time: eventEnd ? eventEnd.toISOString() : null,
    event_timezone: timezone,
    max_approvals: maxApprovalsFromForm(
      form.approvalLimit || "unlimited",
      form.approvalLimitCount ?? 2
    ),
    payment: paymentAmount,
    genre: genreValue,
    skill_level: form.requirements || null,
    organizer_id: organizerId,
    organizer_name: brandOverride
      ? brandOverride.name
      : profile?.brand_name || organizerName,
    is_active: isActive,
    is_archived: false,
    listing_status: listingStatus,
    image_url: form.imageUrl || null,
    additional_info: form.additionalInfo?.trim() || null,
    website: normalizeWebsiteUrl(form.website),
    ...orderValueColumns(form),
  };

  const { body, maxApprovals } = withoutMaxApprovals(insertPayload);
  const { data: inserted, error, droppedColumns } = await writeOpportunity(
    body,
    "insert"
  );

  if (error) {
    return fail(
      "Opportunity Not Saved",
      error.message ||
        "Failed to save the opportunity. Please review the form and try again."
    );
  }

  const row = inserted as { id?: string } | null;
  if (!row?.id) {
    return fail(
      "Opportunity Not Saved",
      "Created opportunity but could not read its id. Check RLS or select permissions."
    );
  }

  await persistMaxApprovals(row.id, maxApprovals);
  return {
    ok: true,
    opportunity: { id: row.id },
    warning: orderValueNotSavedWarning(droppedColumns, body),
  };
}
