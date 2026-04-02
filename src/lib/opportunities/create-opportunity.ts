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
  /** Form status: draft | active | closed — affects `is_active` when mode is publish */
  status: string;
  imageUrl: string;
};

export type CreateOpportunityParams = {
  form: OpportunityCreateFormInput;
  selectedGenres: string[];
  mode: OpportunityCreateMode;
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
  if (!form.date || !form.time || !form.endTime) {
    return fail(
      "Missing Schedule",
      "Please provide a date, start time, and finish time."
    );
  }

  if (form.dateType === "range" && !form.endDate) {
    return fail(
      "Missing End Date",
      "Please provide an end date for the campaign range."
    );
  }

  if (form.dateType === "range" && form.endDate < form.date) {
    return fail(
      "Invalid Date Range",
      "End date must be on or after the start date."
    );
  }

  const eventStart = new Date(`${form.date}T${form.time}`);
  let eventEnd: Date;

  if (form.dateType === "range") {
    eventEnd = new Date(`${form.endDate}T${form.endTime}`);
  } else {
    eventEnd = new Date(`${form.date}T${form.endTime}`);
  }

  if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
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
  const { form, selectedGenres, mode } = params;

  const validationError = validateOpportunityCreate(form);
  if (validationError) return validationError;

  const eventStart = new Date(`${form.date}T${form.time}`);
  const eventEnd =
    form.dateType === "range"
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

  const isActive =
    mode === "publish" && form.status === "active" ? true : false;

  const { data: inserted, error } = await supabase
    .from("opportunities")
    .insert({
      title: form.title.trim(),
      description: processedDescription,
      location: form.location.trim(),
      event_date: eventStart.toISOString(),
      event_end_time: eventEnd.toISOString(),
      payment: paymentAmount,
      genre: genreValue,
      skill_level: form.requirements || null,
      organizer_id: user.id,
      organizer_name: organizerName,
      is_active: isActive,
      is_archived: false,
      image_url: form.imageUrl || null,
    })
    .select("id")
    .single();

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
