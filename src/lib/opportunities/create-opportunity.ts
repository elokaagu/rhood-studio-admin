import { supabase } from "@/integrations/supabase/client";
import { getDisplayText } from "@/lib/text-utils";

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

export function validateOpportunityCreate(
  form: OpportunityCreateFormInput
): CreateOpportunityFailure | null {
  if (!form.date || !form.time) {
    return fail(
      "Missing Schedule",
      "Please provide a start date and start time."
    );
  }

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

  const eventStart = new Date(`${form.date}T${form.time}`);
  let eventEnd: Date | null = null;

  if (!noEndDate) {
    if (form.dateType === "range") {
      eventEnd = new Date(`${form.endDate}T${form.endTime}`);
    } else {
      eventEnd = new Date(`${form.date}T${form.endTime}`);
    }

    if (isNaN(eventStart.getTime()) || !eventEnd || isNaN(eventEnd.getTime())) {
      return fail(
        "Invalid Time",
        "Please enter a valid start and finish time."
      );
    }

    if (eventEnd <= eventStart) {
      return fail(
        "Invalid Schedule",
        "Finish time must be after the start time."
      );
    }
  } else if (isNaN(eventStart.getTime())) {
    return fail("Invalid Time", "Please enter a valid start date and time.");
  }

  if (!form.location.trim()) {
    return fail(
      "Location Required",
      "Please choose a location for this opportunity."
    );
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

  const eventStart = new Date(`${form.date}T${form.time}`);
  const noEndDate = form.dateType === "range" && !!form.noEndDate;
  const eventEnd =
    noEndDate
      ? null
      : form.dateType === "range"
        ? new Date(`${form.endDate}T${form.endTime}`)
        : new Date(`${form.date}T${form.endTime}`);

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

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name, last_name, dj_name")
    .eq("id", user.id)
    .single();

  const organizerName = resolveOrganizerName(
    profile?.dj_name,
    profile?.first_name,
    profile?.last_name,
    user.email ?? undefined
  );

  const paymentAmount = form.pay
    ? parseFloat(form.pay.replace(/[£,]/g, ""))
    : null;

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
    location: form.location.trim(),
    event_date: eventStart.toISOString(),
    event_end_time: eventEnd ? eventEnd.toISOString() : null,
    payment: paymentAmount,
    genre: genreValue,
    skill_level: form.requirements || null,
    organizer_id: brandOverride ? brandOverride.id : user.id,
    organizer_name: brandOverride ? brandOverride.name : organizerName,
    is_active: isActive,
    is_archived: false,
    listing_status: listingStatus,
    image_url: form.imageUrl || null,
  };

  let { data: inserted, error } = await supabase
    .from("opportunities")
    .insert(insertPayload)
    .select("id")
    .single();

  if (
    error &&
    (error.message?.includes("listing_status") ||
      (error.message?.includes("column") &&
        error.message?.includes("does not exist")))
  ) {
    delete insertPayload.listing_status;
    const retry = await supabase
      .from("opportunities")
      .insert(insertPayload)
      .select("id")
      .single();
    inserted = retry.data;
    error = retry.error;
  }

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

  return { ok: true, opportunity: { id: row.id } };
}
