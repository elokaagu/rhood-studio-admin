import { supabase } from "@/integrations/supabase/client";
import type { BrandProfile } from "./types";

const CORE_COLUMNS =
  "id, brand_name, bio, website, profile_image_url, first_name, last_name, email, created_at";
const ONBOARDING_COLUMNS =
  `${CORE_COLUMNS}, studio_agreement_signed_at, studio_agreement_signed_by`;

function rowToBrandProfile(row: {
  id: string;
  brand_name: string | null;
  bio: string | null;
  website?: string | null;
  profile_image_url?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string | null;
  studio_agreement_signed_at?: string | null;
  studio_agreement_signed_by?: string | null;
}): BrandProfile {
  return {
    id: row.id,
    brand_name: row.brand_name,
    brand_description: row.bio,
    website: row.website?.trim() || null,
    profile_image_url: row.profile_image_url?.trim() || null,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    created_at: row.created_at,
    studio_agreement_signed_at: row.studio_agreement_signed_at ?? null,
    studio_agreement_signed_by: row.studio_agreement_signed_by ?? null,
  };
}

/**
 * Loads brand-facing profile fields from `user_profiles` (description stored in `bio`).
 */
export async function fetchBrandProfileForUser(
  userId: string
): Promise<
  { ok: true; profile: BrandProfile } | { ok: false; message: string }
> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(ONBOARDING_COLUMNS)
    .eq("id", userId)
    .single();

  if (error) {
    const fallback = await supabase
      .from("user_profiles")
      .select(CORE_COLUMNS)
      .eq("id", userId)
      .single();
    if (fallback.error || !fallback.data) {
      return {
        ok: false,
        message: error.message || fallback.error?.message || "Failed to load profile.",
      };
    }
    return { ok: true, profile: rowToBrandProfile(fallback.data) };
  }

  if (!data) {
    return { ok: false, message: "Failed to load profile." };
  }

  return {
    ok: true,
    profile: rowToBrandProfile(data),
  };
}
