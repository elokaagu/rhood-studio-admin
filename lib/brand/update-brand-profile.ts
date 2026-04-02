import { supabase } from "@/integrations/supabase/client";
import type { BrandProfileFormFields } from "./types";

export type UpdateBrandProfileResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Persists brand fields. Description maps to `user_profiles.bio`.
 * There is no `website` column on `user_profiles` in the current schema; the form field is not persisted.
 */
export async function updateBrandProfile(
  userId: string,
  fields: BrandProfileFormFields
): Promise<UpdateBrandProfileResult> {
  const { error } = await supabase
    .from("user_profiles")
    .update({
      brand_name: fields.brand_name.trim() || null,
      bio: fields.brand_description.trim() || null,
    })
    .eq("id", userId);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
