import { supabase } from "@/integrations/supabase/client";
import { normalizeWebsiteUrl } from "@/lib/opportunities/website";
import type { BrandProfileFormFields } from "./types";

export type UpdateBrandProfileResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Persists brand fields. Description maps to `user_profiles.bio`.
 */
export async function updateBrandProfile(
  userId: string,
  fields: BrandProfileFormFields
): Promise<UpdateBrandProfileResult> {
  const payload = {
    brand_name: fields.brand_name.trim() || null,
    bio: fields.brand_description.trim() || null,
    website: normalizeWebsiteUrl(fields.website),
  };

  const { error } = await supabase
    .from("user_profiles")
    .update(payload)
    .eq("id", userId);

  if (error) {
    if (error.message?.includes("website")) {
      const { error: retryError } = await supabase
        .from("user_profiles")
        .update({
          brand_name: payload.brand_name,
          bio: payload.bio,
        })
        .eq("id", userId);
      if (retryError) {
        return { ok: false, message: retryError.message };
      }
      return { ok: true };
    }
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
