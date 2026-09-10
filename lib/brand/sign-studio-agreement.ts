import { supabase } from "@/integrations/supabase/client";

export type SignStudioAgreementResult =
  | { ok: true; signed_at: string; signed_by: string }
  | { ok: false; message: string };

export async function signStudioAgreement(
  userId: string,
  signedByName: string
): Promise<SignStudioAgreementResult> {
  const trimmedName = signedByName.trim();
  if (!trimmedName) {
    return { ok: false, message: "Type your full name to sign." };
  }

  const signedAt = new Date().toISOString();
  const { error } = await supabase
    .from("user_profiles")
    .update({
      studio_agreement_signed_at: signedAt,
      studio_agreement_signed_by: trimmedName,
    })
    .eq("id", userId);

  if (error) {
    return {
      ok: false,
      message: error.message || "Failed to save the signed agreement.",
    };
  }

  return { ok: true, signed_at: signedAt, signed_by: trimmedName };
}

export async function markStudioTourComplete(
  userId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await supabase
    .from("user_profiles")
    .update({
      studio_tour_completed_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return { ok: false, message: error.message || "Failed to save tour progress." };
  }
  return { ok: true };
}
