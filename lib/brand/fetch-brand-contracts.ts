import { supabase } from "@/integrations/supabase/client";
import type { BrandAcceptedContract } from "./types";

export async function fetchAcceptedContractsForBrand(
  brandUserId: string
): Promise<
  | { ok: true; contracts: BrandAcceptedContract[] }
  | { ok: false; message: string }
> {
  const { data, error } = await supabase
    .from("booking_requests")
    .select(
      `
          id,
          event_title,
          event_date,
          location,
          payment_amount,
          payment_currency,
          status,
          dj_profile:user_profiles!booking_requests_dj_id_fkey(
            dj_name,
            profile_image_url
          )
        `
    )
    .eq("brand_id", brandUserId)
    .eq("status", "accepted")
    .order("event_date", { ascending: false });

  if (error) {
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    contracts: (data as BrandAcceptedContract[]) || [],
  };
}
