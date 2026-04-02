import { supabase } from "@/integrations/supabase/client";
import type { BrandProfileFormFields } from "./types";

const URL_PATTERN =
  /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

export type UpdateBrandProfileResult =
  | { ok: true }
  | { ok: false; message: string; code?: "invalid_website" };

function normalizeWebsite(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (!URL_PATTERN.test(t)) {
    return null;
  }
  let url = t;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url;
}

/**
 * Persists brand fields for the given user. Validates website when non-empty.
 */
export async function updateBrandProfile(
  userId: string,
  fields: BrandProfileFormFields
): Promise<UpdateBrandProfileResult> {
  const websiteRaw = fields.website.trim();
  let website: string | null = null;
  if (websiteRaw) {
    const normalized = normalizeWebsite(websiteRaw);
    if (normalized === null) {
      return {
        ok: false,
        message:
          "Please enter a valid website URL (e.g., https://example.com)",
        code: "invalid_website",
      };
    }
    website = normalized;
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({
      brand_name: fields.brand_name.trim() || null,
      brand_description: fields.brand_description.trim() || null,
      website,
    })
    .eq("id", userId);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
