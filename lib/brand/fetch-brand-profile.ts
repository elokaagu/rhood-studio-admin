import { supabase } from "@/integrations/supabase/client";
import type { BrandProfile } from "./types";

function rowToBrandProfile(row: {
  id: string;
  brand_name: string | null;
  bio: string | null;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string | null;
}): BrandProfile {
  return {
    id: row.id,
    brand_name: row.brand_name,
    brand_description: row.bio,
    website: null,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    created_at: row.created_at,
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
    .select("id, brand_name, bio, first_name, last_name, email, created_at")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return {
      ok: false,
      message: error?.message || "Failed to load profile.",
    };
  }

  return {
    ok: true,
    profile: rowToBrandProfile(data),
  };
}
