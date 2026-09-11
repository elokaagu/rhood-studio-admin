import { supabase } from "@/integrations/supabase/client";

export async function deleteBookingRequest(
  bookingRequestId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!bookingRequestId?.trim()) {
    return { ok: false, message: "Missing booking request id." };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { ok: false, message: "Not authenticated." };
  }

  try {
    const response = await fetch("/api/admin/delete-booking-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bookingRequestId: bookingRequestId.trim() }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      return { ok: false, message: payload.error || "Failed to delete booking request." };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to delete booking request." };
  }
}
