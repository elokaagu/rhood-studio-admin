export type StudioOnboardingRecord = {
  signed_at: string | null;
  signed_by: string | null;
  tour_completed_at: string | null;
};

function storageKey(userId: string): string {
  return `rhood-studio-onboarding:${userId}`;
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

function readLocal(userId: string): StudioOnboardingRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StudioOnboardingRecord>;
    return {
      signed_at: parsed.signed_at ?? null,
      signed_by: parsed.signed_by ?? null,
      tour_completed_at: parsed.tour_completed_at ?? null,
    };
  } catch {
    return null;
  }
}

function writeLocal(userId: string, record: StudioOnboardingRecord): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

export async function loadStudioOnboardingStore(
  userId: string
): Promise<StudioOnboardingRecord | null> {
  return readLocal(userId);
}

export async function saveStudioOnboardingStore(
  userId: string,
  patch: Partial<StudioOnboardingRecord>
): Promise<{ ok: true } | { ok: false; message: string }> {
  const existing = readLocal(userId) ?? EMPTY_RECORD;
  const next: StudioOnboardingRecord = {
    signed_at: patch.signed_at !== undefined ? patch.signed_at : existing.signed_at,
    signed_by: patch.signed_by !== undefined ? patch.signed_by : existing.signed_by,
    tour_completed_at:
      patch.tour_completed_at !== undefined
        ? patch.tour_completed_at
        : existing.tour_completed_at,
  };

  if (!writeLocal(userId, next)) {
    return { ok: false, message: "Failed to save the signed agreement." };
  }
  return { ok: true };
}
