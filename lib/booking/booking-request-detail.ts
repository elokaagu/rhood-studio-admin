import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/lib/auth-utils";
import { createNotification } from "@/lib/notifications";

export interface BookingRequestProfile {
  brand_name: string | null;
  first_name: string;
  last_name: string;
  email: string;
}

export interface BookingRequestDjProfile {
  dj_name: string | null;
  first_name: string;
  last_name: string;
  email: string;
}

export interface BookingRequestDetail {
  id: string;
  brand_id: string;
  dj_id: string;
  event_title: string;
  event_description: string | null;
  event_date: string;
  event_end_time: string;
  location: string;
  location_place_id: string | null;
  payment_amount: number | null;
  payment_currency: string;
  genre: string | null;
  additional_requirements: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: "pending" | "accepted" | "declined" | "cancelled";
  dj_response_at: string | null;
  dj_response_notes: string | null;
  created_at: string;
  brand_profile: BookingRequestProfile | null;
  dj_profile: BookingRequestDjProfile | null;
}

export type RespondToBookingResult =
  | {
      ok: true;
      status: "accepted" | "declined";
      dj_response_at: string;
      dj_response_notes: string | null;
    }
  | { ok: false; message: string };

/**
 * DJ accepts or declines a pending booking; notifies the brand. Caller should ensure UI access rules.
 */
export async function respondToBookingRequest(params: {
  bookingRequestId: string;
  responseType: "accept" | "decline";
  notes: string;
  eventTitle: string;
  brandId: string;
  djDisplayName: string;
}): Promise<RespondToBookingResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { ok: false, message: "User not authenticated." };
  }

  const { data: row, error: fetchError } = await supabase
    .from("booking_requests")
    .select("id, dj_id, status")
    .eq("id", params.bookingRequestId)
    .single();

  if (fetchError || !row) {
    return { ok: false, message: "Booking request not found." };
  }

  if (row.dj_id !== userId) {
    return { ok: false, message: "Only the assigned DJ can respond to this request." };
  }

  if (row.status !== "pending") {
    return { ok: false, message: "This booking request is no longer pending." };
  }

  const nextStatus = params.responseType === "accept" ? "accepted" : "declined";
  const respondedAt = new Date().toISOString();
  const trimmedNotes = params.notes.trim() || null;

  const { error: updateError } = await supabase
    .from("booking_requests")
    .update({
      status: nextStatus,
      dj_response_at: respondedAt,
      dj_response_notes: trimmedNotes,
    })
    .eq("id", params.bookingRequestId);

  if (updateError) {
    return { ok: false, message: updateError.message || "Failed to update booking." };
  }

  try {
    await createNotification({
      title:
        params.responseType === "accept" ? "✅ Booking Accepted" : "❌ Booking Declined",
      message: `DJ ${params.djDisplayName} ${
        params.responseType === "accept" ? "accepted" : "declined"
      } your booking request for "${params.eventTitle}"`,
      type: `booking_${params.responseType === "accept" ? "accepted" : "declined"}`,
      user_id: params.brandId,
      related_id: params.bookingRequestId,
    });
  } catch (e) {
    console.error("Error creating booking response notification:", e);
  }

  return {
    ok: true,
    status: nextStatus,
    dj_response_at: respondedAt,
    dj_response_notes: trimmedNotes,
  };
}
