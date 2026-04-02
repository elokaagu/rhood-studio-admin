import { supabase } from "@/integrations/supabase/client";
import type { BrandProfile } from "./types";

function rowToBrandProfile(row: {
  id: string;
  brand_name: string | null;
  brand_description?: string | null;
  website?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string | null;
}): BrandProfile {
  return {
    id: row.id,
    brand_name: row.brand_name,
    brand_description: row.brand_description ?? null,
    website: row.website ?? null,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    created_at: row.created_at,
  };
}

/**
 * Loads brand-facing profile fields. If extended columns are missing (migration),
 * falls back to a minimal select — handled here, not in UI.
 */
export async function fetchBrandProfileForUser(
  userId: string
): Promise<
  { ok: true; profile: BrandProfile } | { ok: false; message: string }
> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "id, brand_name, brand_description, website, first_name, last_name, email, created_at"
    )
    .eq("id", userId)
    .single();

  if (!error && data) {
    return {
      ok: true,
      profile: rowToBrandProfile(
        data as {
          id: string;
          brand_name: string | null;
          brand_description?: string | null;
          website?: string | null;
          first_name: string;
          last_name: string;
          email: string;
          created_at: string | null;
        }
      ),
    };
  }

  const missingColumn =
    error?.message?.includes("does not exist") || error?.code === "42703";

  if (missingColumn) {
    const { data: basic, error: basicError } = await supabase
      .from("user_profiles")
      .select("id, brand_name, first_name, last_name, email, created_at")
      .eq("id", userId)
      .single();

    if (basicError || !basic) {
      return {
        ok: false,
        message: basicError?.message || error?.message || "Failed to load profile.",
      };
    }

    return {
      ok: true,
      profile: rowToBrandProfile({
        ...basic,
        brand_description: null,
        website: null,
      }),
    };
  }

  return {
    ok: false,
    message: error?.message || "Failed to load profile.",
  };
}
