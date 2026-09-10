import { supabase } from "@/integrations/supabase/client";

/**
 * Brands already upload logos to this bucket/prefix, so storage policies allow writes.
 * Used when `user_profiles.studio_*` columns are not in the live schema yet.
 */
const BUCKET = "opportunities";

export type StudioOnboardingRecord = {
  signed_at: string | null;
  signed_by: string | null;
  tour_completed_at: string | null;
};

function storagePath(userId: string): string {
  return `brand-avatars/${userId}/studio-onboarding.txt`;
}

export function isMissingStudioColumnError(message: string | undefined): boolean {
  const text = (message || "").toLowerCase();
  return (
    text.includes("studio_agreement") ||
    text.includes("studio_tour") ||
    (text.includes("studio_") && text.includes("schema cache")) ||
    text.includes("studio_agreement_signed_at")
  );
}

const EMPTY_RECORD: StudioOnboardingRecord = {
  signed_at: null,
  signed_by: null,
  tour_completed_at: null,
};

export async function loadStudioOnboardingStore(
  userId: string
): Promise<StudioOnboardingRecord | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(storagePath(userId));

  if (error || !data) return null;

  try {
    const parsed = JSON.parse(await data.text()) as Partial<StudioOnboardingRecord>;
    return {
      signed_at: parsed.signed_at ?? null,
      signed_by: parsed.signed_by ?? null,
      tour_completed_at: parsed.tour_completed_at ?? null,
    };
  } catch {
    return null;
  }
}

export async function saveStudioOnboardingStore(
  userId: string,
  patch: Partial<StudioOnboardingRecord>
): Promise<{ ok: true } | { ok: false; message: string }> {
  const existing = (await loadStudioOnboardingStore(userId)) ?? EMPTY_RECORD;
  const next: StudioOnboardingRecord = {
    signed_at: patch.signed_at !== undefined ? patch.signed_at : existing.signed_at,
    signed_by: patch.signed_by !== undefined ? patch.signed_by : existing.signed_by,
    tour_completed_at:
      patch.tour_completed_at !== undefined
        ? patch.tour_completed_at
        : existing.tour_completed_at,
  };

  const { error } = await supabase.storage.from(BUCKET).upload(
    storagePath(userId),
    JSON.stringify(next),
    {
      upsert: true,
      contentType: "text/plain",
      cacheControl: "0",
    }
  );

  if (error) {
    return { ok: false, message: error.message || "Failed to save the signed agreement." };
  }
  return { ok: true };
}
