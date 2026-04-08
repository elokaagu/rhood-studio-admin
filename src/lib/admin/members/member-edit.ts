import { supabase } from "@/integrations/supabase/client";
import { formatDateShort } from "@/lib/date-utils";

export type MemberEditView = {
  id: string;
  name: string;
  email: string;
  location: string;
  joinDateLabel: string;
  bio: string;
  profileImageUrl?: string;
};

export type MemberEditFormState = {
  dj_name: string;
  first_name: string;
  last_name: string;
  email: string;
  city: string;
  bio: string;
  /** Stored as handle (not full URL) for stable inputs */
  instagram: string;
  soundcloud: string;
};

type ProfileRow = {
  id: string;
  dj_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  city: string | null;
  bio: string | null;
  profile_image_url: string | null;
  instagram: string | null;
  soundcloud: string | null;
  created_at: string | null;
};

function applicationsTable() {
  return (supabase as unknown as { from: (name: string) => any }).from(
    "applications"
  );
}

/** Prefer DJ name, then non-empty trimmed full name, then email, else Unknown */
export function displayNameFromProfile(row: {
  dj_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}): string {
  const dj = row.dj_name?.trim();
  if (dj) return dj;
  const first = row.first_name?.trim() ?? "";
  const last = row.last_name?.trim() ?? "";
  const full = `${first} ${last}`.trim();
  if (full) return full;
  const email = row.email?.trim();
  if (email) return email;
  return "Unknown";
}

function normalizeHandleSegment(raw: string): string {
  return raw.trim().replace(/^@+/, "").replace(/\/+$/, "");
}

/**
 * Extract Instagram handle from stored URL, path, or bare handle.
 */
export function instagramStoredToHandle(stored: string | null | undefined): string {
  if (!stored?.trim()) return "";
  const t = stored.trim();
  if (t.startsWith("@")) return normalizeHandleSegment(t);
  try {
    const url = t.includes("://") ? new URL(t) : new URL(`https://${t}`);
    if (/instagram\.com$/i.test(url.hostname.replace(/^www\./, ""))) {
      const seg = url.pathname.split("/").filter(Boolean)[0];
      return seg ? normalizeHandleSegment(seg) : "";
    }
  } catch {
    /* fall through */
  }
  return normalizeHandleSegment(t);
}

/**
 * Extract SoundCloud handle from stored URL or handle.
 */
export function soundcloudStoredToHandle(stored: string | null | undefined): string {
  if (!stored?.trim()) return "";
  const t = stored.trim();
  if (t.startsWith("@")) return normalizeHandleSegment(t);
  try {
    const url = t.includes("://") ? new URL(t) : new URL(`https://${t}`);
    if (/soundcloud\.com$/i.test(url.hostname.replace(/^www\./, ""))) {
      const parts = url.pathname.split("/").filter(Boolean);
      return parts[0] ? normalizeHandleSegment(parts[0]) : "";
    }
  } catch {
    /* fall through */
  }
  return normalizeHandleSegment(t);
}

export function instagramHandleToStored(handle: string): string {
  const h = normalizeHandleSegment(handle);
  if (!h) return "";
  return `https://instagram.com/${h}`;
}

export function soundcloudHandleToStored(handle: string): string {
  const h = normalizeHandleSegment(handle);
  if (!h) return "";
  return `https://soundcloud.com/${h}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateMemberEdit(data: MemberEditFormState): string | null {
  const email = data.email.trim();
  if (!email) return "Email is required.";
  if (!EMAIL_RE.test(email)) return "Enter a valid email address.";
  return null;
}

function trimFields(data: MemberEditFormState): MemberEditFormState {
  return {
    dj_name: data.dj_name.trim(),
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    email: data.email.trim(),
    city: data.city.trim(),
    bio: data.bio.trim(),
    instagram: data.instagram.trim(),
    soundcloud: data.soundcloud.trim(),
  };
}

export async function fetchMemberForEdit(
  memberId: string
): Promise<
  | { ok: true; member: MemberEditView; form: MemberEditFormState }
  | { ok: false; message: string }
> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "id, dj_name, first_name, last_name, email, city, bio, profile_image_url, instagram, soundcloud, created_at"
    )
    .eq("id", memberId)
    .single();

  if (error || !data) {
    return {
      ok: false,
      message: error?.message || "Member not found.",
    };
  }

  const row = data as ProfileRow;
  const joinDateLabel = row.created_at
    ? formatDateShort(row.created_at)
    : "Unknown";

  const form: MemberEditFormState = {
    dj_name: row.dj_name ?? "",
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    email: row.email ?? "",
    city: row.city ?? "",
    bio: row.bio ?? "",
    instagram: instagramStoredToHandle(row.instagram),
    soundcloud: soundcloudStoredToHandle(row.soundcloud),
  };

  const member: MemberEditView = {
    id: row.id,
    name: displayNameFromProfile(row),
    email: row.email?.trim() || "No email",
    location: row.city?.trim() || "Unknown",
    joinDateLabel,
    bio: row.bio ?? "",
    profileImageUrl: row.profile_image_url ?? undefined,
  };

  return { ok: true, member, form };
}

export async function updateMemberProfile(
  memberId: string,
  data: MemberEditFormState
): Promise<{ ok: true } | { ok: false; message: string }> {
  const trimmed = trimFields(data);
  const validation = validateMemberEdit(trimmed);
  if (validation) return { ok: false, message: validation };

  /** Matches `user_profiles` Update: string columns are `string`, not `null`. */
  const payload = {
    dj_name: trimmed.dj_name || "",
    first_name: trimmed.first_name || "",
    last_name: trimmed.last_name || "",
    email: trimmed.email,
    city: trimmed.city || "",
    bio: trimmed.bio || null,
    instagram: trimmed.instagram
      ? instagramHandleToStored(trimmed.instagram)
      : null,
    soundcloud: trimmed.soundcloud
      ? soundcloudHandleToStored(trimmed.soundcloud)
      : null,
  };

  const { error } = await supabase
    .from("user_profiles")
    .update(payload)
    .eq("id", memberId);

  if (error) {
    return { ok: false, message: error.message || "Failed to update profile." };
  }
  return { ok: true };
}

/** Approved + completed gigs (aligned with dashboard “active” gig completion). */
export async function fetchMemberCompletedGigsCount(
  memberId: string
): Promise<number> {
  const { count, error } = await applicationsTable()
    .select("id", { count: "exact", head: true })
    .eq("user_id", memberId)
    .eq("status", "approved")
    .eq("gig_completed", true);

  if (error) return 0;
  return count ?? 0;
}
