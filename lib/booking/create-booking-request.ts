import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserId } from "@/lib/auth-utils";
import { createNotification } from "@/lib/notifications";
import type {
  BookingRequestFormData,
  BrandContextForBooking,
  CreateBookingRequestResult,
  DjProfileForBooking,
} from "@/lib/booking/types";

const DEFAULT_FORM: BookingRequestFormData = {
  event_title: "",
  event_description: "",
  event_date: "",
  event_time: "",
  event_end_time: "",
  location: "",
  locationPlaceId: "",
  payment_amount: "",
  payment_currency: "GBP",
  genre: "",
  additional_requirements: "",
  contact_email: "",
  contact_phone: "",
};

export function getDefaultBookingRequestForm(): BookingRequestFormData {
  return { ...DEFAULT_FORM };
}

function fail(title: string, message: string): CreateBookingRequestResult {
  return { ok: false, title, message };
}

/**
 * Client-side validation + insert + downstream notifications (email, in-app, DM).
 * Server-side validation should be added at an API boundary when this flow hardens.
 */
export async function createBookingRequestWithNotifications(params: {
  djId: string;
  formData: BookingRequestFormData;
  djProfile: DjProfileForBooking;
  brandContext: BrandContextForBooking | null;
}): Promise<CreateBookingRequestResult> {
  const { djId, formData, djProfile, brandContext } = params;

  if (!formData.event_title.trim()) {
    return fail("Missing Title", "Please provide an event title.");
  }

  if (!formData.event_date || !formData.event_time || !formData.event_end_time) {
    return fail(
      "Missing Schedule",
      "Please provide event date, start time, and end time."
    );
  }

  if (!formData.location.trim()) {
    return fail("Missing Location", "Please provide an event location.");
  }

  const brandUserId = await getCurrentUserId();
  if (!brandUserId) {
    return fail("Authentication Error", "Please log in to submit a booking request.");
  }

  const eventStart = new Date(`${formData.event_date}T${formData.event_time}`);
  const eventEnd = new Date(`${formData.event_date}T${formData.event_end_time}`);

  if (Number.isNaN(eventStart.getTime()) || Number.isNaN(eventEnd.getTime())) {
    return fail("Invalid Time", "Please enter valid start and end times.");
  }

  if (eventEnd <= eventStart) {
    return fail("Invalid Schedule", "End time must be after start time.");
  }

  const paymentAmount = formData.payment_amount
    ? parseFloat(formData.payment_amount.replace(/[£,]/g, ""))
    : null;

  const { data: bookingRequest, error: insertError } = await supabase
    .from("booking_requests")
    .insert({
      brand_id: brandUserId,
      dj_id: djId,
      event_title: formData.event_title.trim(),
      event_description: formData.event_description.trim() || null,
      event_date: eventStart.toISOString(),
      event_end_time: eventEnd.toISOString(),
      location: formData.location.trim(),
      location_place_id: formData.locationPlaceId || null,
      payment_amount: paymentAmount,
      payment_currency: formData.payment_currency,
      genre: formData.genre || null,
      additional_requirements: formData.additional_requirements.trim() || null,
      contact_email: formData.contact_email.trim() || null,
      contact_phone: formData.contact_phone.trim() || null,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  const bookingRequestId = bookingRequest.id as string;
  const brandLabel = brandContext?.brand_name || "A Brand";
  const djDisplayName =
    djProfile.dj_name ||
    [djProfile.first_name, djProfile.last_name].filter(Boolean).join(" ").trim() ||
    "DJ";

  // Email to DJ (non-fatal)
  try {
    const response = await fetch("/api/notifications/booking-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        djEmail: djProfile.email,
        djName: djDisplayName,
        brandName: brandLabel,
        eventTitle: formData.event_title,
        eventDate: eventStart.toISOString(),
        eventEndTime: eventEnd.toISOString(),
        location: formData.location,
        paymentAmount,
        paymentCurrency: formData.payment_currency,
        bookingRequestId,
      }),
    });
    if (!response.ok) {
      console.error("Failed to send booking request email notification");
    }
  } catch (emailError) {
    console.error("Error sending booking email:", emailError);
  }

  // In-app notification for DJ (non-fatal)
  try {
    await createNotification({
      title: "🎵 New Booking Request",
      message: `${brandLabel} wants to book you for "${formData.event_title}"`,
      type: "booking_request",
      user_id: djId,
      related_id: bookingRequestId,
    });
  } catch (notificationError) {
    console.error("Error creating booking notification:", notificationError);
  }

  // Direct message to DJ (non-fatal)
  try {
    const messageContent = `Hi! I'd like to book you for "${formData.event_title}" on ${new Date(formData.event_date).toLocaleDateString()} at ${formData.location}. Please check your booking requests for full details. Looking forward to hearing from you!`;

    const { error: messageError } = await supabase.from("messages").insert({
      sender_id: brandUserId,
      receiver_id: djId,
      content: messageContent,
      is_read: false,
    });

    if (messageError) {
      console.error("Error creating direct message:", messageError);
    }
  } catch (messageError) {
    console.error("Error creating direct message:", messageError);
  }

  return { ok: true, bookingRequestId };
}
