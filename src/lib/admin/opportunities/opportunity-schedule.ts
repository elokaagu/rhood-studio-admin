import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type ScheduleFormState = {
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  locationPlaceId: string;
  setupTime: string;
  soundcheckTime: string;
  capacity: string;
  notes: string;
  /** draft | scheduled | confirmed | completed */
  scheduleStatus: string;
};

export type ScheduleDetailsStored = {
  setup_time?: string;
  soundcheck_time?: string;
  capacity?: number | string;
  notes?: string;
  schedule_status?: string;
};

function parseScheduleDetails(raw: Json | null | undefined): ScheduleDetailsStored {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as ScheduleDetailsStored;
}

export function opportunityRowToScheduleForm(row: {
  event_date: string | null;
  event_end_time: string | null;
  location: string;
  schedule_details?: Json | null;
}): ScheduleFormState {
  const eventDateObj = row.event_date ? new Date(row.event_date) : null;
  const eventEndObj = row.event_end_time ? new Date(row.event_end_time) : null;

  const dateStr = eventDateObj
    ? eventDateObj.toISOString().split("T")[0]
    : "";
  const startStr = eventDateObj
    ? eventDateObj.toTimeString().split(" ")[0].substring(0, 5)
    : "";
  const endStr = eventEndObj
    ? eventEndObj.toTimeString().split(" ")[0].substring(0, 5)
    : "";

  const d = parseScheduleDetails(row.schedule_details ?? null);
  const status =
    d.schedule_status &&
    ["draft", "scheduled", "confirmed", "completed"].includes(d.schedule_status)
      ? d.schedule_status
      : "scheduled";

  const cap =
    d.capacity !== undefined && d.capacity !== null
      ? String(d.capacity)
      : "";

  return {
    eventDate: dateStr,
    startTime: startStr,
    endTime: endStr,
    venue: row.location || "",
    locationPlaceId: "",
    setupTime: d.setup_time ?? "",
    soundcheckTime: d.soundcheck_time ?? "",
    capacity: cap,
    notes: d.notes ?? "",
    scheduleStatus: status,
  };
}

export function validateScheduleForm(
  form: ScheduleFormState
):
  | { ok: true; eventStart: Date; eventEnd: Date }
  | { ok: false; message: string } {
  if (!form.eventDate || !form.startTime || !form.endTime) {
    return {
      ok: false,
      message: "Please provide event date, start time, and end time.",
    };
  }

  if (!form.venue.trim()) {
    return { ok: false, message: "Please enter a venue or address." };
  }

  const eventStart = new Date(`${form.eventDate}T${form.startTime}`);
  let eventEnd = new Date(`${form.eventDate}T${form.endTime}`);

  if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
    return { ok: false, message: "Invalid date or time." };
  }

  if (eventEnd <= eventStart) {
    eventEnd = new Date(eventEnd.getTime() + 24 * 60 * 60 * 1000);
  }

  if (form.capacity.trim()) {
    const n = parseInt(form.capacity.trim(), 10);
    if (!Number.isFinite(n) || n < 0) {
      return {
        ok: false,
        message: "Capacity must be a non-negative whole number.",
      };
    }
  }

  const orderMsg = validateTimeOrder(
    form.setupTime,
    form.soundcheckTime,
    form.startTime
  );
  if (orderMsg) {
    return { ok: false, message: orderMsg };
  }

  return { ok: true, eventStart, eventEnd };
}

function timeToMinutes(t: string): number | null {
  if (!t.trim()) return null;
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/** If all three set, enforce setup ≤ soundcheck ≤ start. */
function validateTimeOrder(
  setup: string,
  soundcheck: string,
  start: string
): string | null {
  const hasSetup = setup.trim().length > 0;
  const hasSc = soundcheck.trim().length > 0;
  if (hasSetup !== hasSc) {
    return "Enter both setup and soundcheck times, or leave both empty.";
  }
  if (!hasSetup && !hasSc) return null;

  const s = timeToMinutes(setup);
  const sc = timeToMinutes(soundcheck);
  const st = timeToMinutes(start);
  if (s === null || sc === null || st === null) {
    return "Invalid setup, soundcheck, or start time.";
  }
  if (s > sc || sc > st) {
    return "Setup time must be at or before soundcheck, and soundcheck at or before start time.";
  }
  return null;
}

export function buildScheduleUpdatePayload(
  form: ScheduleFormState,
  validated: { eventStart: Date; eventEnd: Date },
  mode: "draft" | "publish"
): {
  event_date: string;
  event_end_time: string;
  location: string;
  schedule_details: Json;
} {
  const scheduleStatus = mode === "draft" ? "draft" : form.scheduleStatus;

  const details: Record<string, string | number> = {
    schedule_status: scheduleStatus,
  };
  if (form.setupTime.trim()) {
    details.setup_time = form.setupTime.trim();
  }
  if (form.soundcheckTime.trim()) {
    details.soundcheck_time = form.soundcheckTime.trim();
  }
  if (form.notes.trim()) {
    details.notes = form.notes.trim();
  }
  if (form.capacity.trim()) {
    const n = parseInt(form.capacity.trim(), 10);
    if (Number.isFinite(n)) {
      details.capacity = n;
    }
  }

  return {
    event_date: validated.eventStart.toISOString(),
    event_end_time: validated.eventEnd.toISOString(),
    location: form.venue.trim(),
    schedule_details: details as unknown as Json,
  };
}

export async function saveOpportunitySchedule(
  opportunityId: string,
  payload: ReturnType<typeof buildScheduleUpdatePayload>
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await supabase
    .from("opportunities")
    .update(payload)
    .eq("id", opportunityId);

  if (error) {
    return { ok: false, message: error.message || "Failed to save schedule." };
  }
  return { ok: true };
}
