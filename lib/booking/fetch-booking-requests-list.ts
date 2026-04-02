import { supabase } from "@/integrations/supabase/client";
import type { UserRole } from "@/lib/auth-utils";

export interface BookingRequestListRow {
  id: string;
  brand_id: string;
  dj_id: string;
  event_title: string;
  event_description: string | null;
  event_date: string;
  event_end_time: string;
  location: string;
  payment_amount: number | null;
  payment_currency: string;
  genre: string | null;
  status: "pending" | "accepted" | "declined" | "cancelled";
  dj_response_at: string | null;
  dj_response_notes: string | null;
  created_at: string;
  dj_profile: {
    dj_name: string;
    profile_image_url: string | null;
    city: string;
  } | null;
}

/**
 * Booking requests visible to the current portal user: brands see what they sent;
 * DJs and other non-brand roles use the DJ inbox (same filter as legacy list).
 */
export async function getBookingRequestsForUser(
  userId: string,
  role: UserRole
): Promise<
  | { ok: true; data: BookingRequestListRow[] }
  | { ok: false; message: string }
> {
  let query = supabase
    .from("booking_requests")
    .select(
      `
          *,
          dj_profile:user_profiles!booking_requests_dj_id_fkey(
            dj_name,
            profile_image_url,
            city
          )
        `
    )
    .order("created_at", { ascending: false });

  if (role === "brand") {
    query = query.eq("brand_id", userId);
  } else {
    query = query.eq("dj_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, data: (data as BookingRequestListRow[]) || [] };
}
