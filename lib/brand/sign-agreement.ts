import { supabase } from "@/integrations/supabase/client";

export type SignAgreementResult =
  | { ok: true; signed_at: string; signed_by: string }
  | { ok: false; message: string };

export async function signBrandAgreement(
  bookingRequestId: string,
  signedByName: string
): Promise<SignAgreementResult> {
  const trimmedName = signedByName.trim();
  if (!trimmedName) {
    return { ok: false, message: "Enter your full name to sign." };
  }

  const signedAt = new Date().toISOString();

  const { error } = await (supabase as any)
    .from("booking_requests")
    .update({
      agreement_signed_at: signedAt,
      agreement_signed_by: trimmedName,
    })
    .eq("id", bookingRequestId);

  if (error) {
    return { ok: false, message: error.message || "Failed to sign agreement." };
  }

  return { ok: true, signed_at: signedAt, signed_by: trimmedName };
}
