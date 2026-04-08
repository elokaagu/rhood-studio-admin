import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/date-utils";
import {
  displayNameFromProfile,
  instagramHandleToStored,
  instagramStoredToHandle,
  soundcloudHandleToStored,
  soundcloudStoredToHandle,
} from "@/lib/admin/members/member-edit";

const ACTIVE_DAYS_THRESHOLD = 30;

function applicationsTable() {
  return (supabase as unknown as { from: (name: string) => any }).from(
    "applications"
  );
}

/** DJ → brand → trimmed full name → email → Unknown */
export function displayNameForAdminDetail(row: {
  dj_name?: string | null;
  brand_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}): string {
  const dj = row.dj_name?.trim();
  if (dj) return dj;
  const brand = row.brand_name?.trim();
  if (brand) return brand;
  return displayNameFromProfile(row);
}

function activityStatusFromUpdatedAt(
  updatedAt: string | null | undefined
): "active" | "inactive" {
  if (!updatedAt) return "inactive";
  const updated = new Date(updatedAt).getTime();
  if (Number.isNaN(updated)) return "inactive";
  const days = (Date.now() - updated) / (1000 * 60 * 60 * 24);
  return days <= ACTIVE_DAYS_THRESHOLD ? "active" : "inactive";
}

export type AdminMemberInviteCodeRow = {
  id: string;
  code: string;
  brand_name: string;
  used_at: string | null;
  created_at: string | null;
  created_by_profile: {
    dj_name: string | null;
    first_name: string | null;
    last_name: string | null;
    brand_name: string | null;
    email: string | null;
  } | null;
};

export type AdminMemberProfileView = {
  id: string;
  role: string | null;
  /** Primary display name (DJ → brand → name → email) */
  name: string;
  brandName: string | null;
  email: string;
  location: string;
  joinDate: string;
  genres: string[];
  activityStatus: "active" | "inactive";
  gigs: number;
  bio: string;
  profileImageUrl?: string;
  rating: number;
  credits: number;
  socialLinks: {
    instagram: string;
    soundcloud: string;
  };
};

export type FetchAdminMemberProfileResult =
  | { ok: true; member: AdminMemberProfileView; inviteCodes: AdminMemberInviteCodeRow[] }
  | { ok: false; message: string };

/**
 * Loads profile, gig/rating stats, and invite codes for the admin member detail page.
 */
export async function fetchAdminMemberProfile(
  memberId: string
): Promise<FetchAdminMemberProfileResult> {
  if (!memberId?.trim()) {
    return { ok: false, message: "Missing member id." };
  }

  const { data: row, error } = await supabase
    .from("user_profiles")
    .select(
      "id, role, dj_name, brand_name, first_name, last_name, email, city, bio, profile_image_url, instagram, soundcloud, genres, created_at, updated_at"
    )
    .eq("id", memberId)
    .single();

  if (error || !row) {
    return {
      ok: false,
      message: error?.message || "Member not found.",
    };
  }

  const data = row as {
    id: string;
    role: string | null;
    dj_name: string | null;
    brand_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
    city: string | null;
    bio: string | null;
    profile_image_url: string | null;
    instagram: string | null;
    soundcloud: string | null;
    genres: string[] | null;
    created_at: string | null;
    updated_at: string | null;
  };

  const [gigsRes, feedbackRes, inviteRes] = await Promise.all([
    applicationsTable()
      .select("id", { count: "exact", head: true })
      .eq("user_id", data.id)
      .eq("status", "approved")
      .eq("gig_completed", true),
    supabase
      .from("ai_matching_feedback")
      .select("rating")
      .eq("user_id", data.id),
    supabase
      .from("invite_codes")
      .select(
        `
          id,
          code,
          brand_name,
          used_at,
          created_at,
          created_by_profile:user_profiles!invite_codes_created_by_fkey(dj_name, first_name, last_name, brand_name, email)
        `
      )
      .eq("used_by", data.id)
      .order("used_at", { ascending: false }),
  ]);

  let gigsCount = 0;
  if (!gigsRes.error && gigsRes.count !== null) {
    gigsCount = gigsRes.count;
  }

  let rating = 0;
  const feedbackData = feedbackRes.data;
  if (!feedbackRes.error && feedbackData && feedbackData.length > 0) {
    const totalRating = feedbackData.reduce(
      (sum, f) => sum + (f.rating || 0),
      0
    );
    rating = Math.round((totalRating / feedbackData.length) * 10) / 10;
  }

  const inviteCodes: AdminMemberInviteCodeRow[] = (inviteRes.data ?? []).map(
    (c: any) => ({
      id: c.id,
      code: c.code,
      brand_name: c.brand_name,
      used_at: c.used_at,
      created_at: c.created_at,
      created_by_profile: c.created_by_profile ?? null,
    })
  );

  const joinDate = data.created_at
    ? (() => {
        const formatted = formatDate(data.created_at);
        return formatted === "Invalid Date" ? "Unknown" : formatted;
      })()
    : "Unknown";

  const ext = data as unknown as { credits?: number | null };
  const credits =
    typeof ext.credits === "number" && !Number.isNaN(ext.credits)
      ? ext.credits
      : 0;

  const member: AdminMemberProfileView = {
    id: data.id,
    role: data.role,
    name: displayNameForAdminDetail(data),
    brandName: data.brand_name?.trim() || null,
    email: data.email?.trim() || "No email",
    location: data.city?.trim() || "Unknown",
    joinDate,
    genres: data.genres ?? [],
    activityStatus: activityStatusFromUpdatedAt(data.updated_at),
    gigs: gigsCount,
    bio: data.bio?.trim() || "No bio available",
    profileImageUrl: data.profile_image_url ?? undefined,
    rating,
    credits,
    socialLinks: {
      instagram: instagramStoredToHandle(data.instagram),
      soundcloud: soundcloudStoredToHandle(data.soundcloud),
    },
  };

  if (inviteRes.error) {
    console.warn("Invite codes fetch:", inviteRes.error);
  }

  return { ok: true, member, inviteCodes };
}

export function creatorLabelFromInviteCode(
  p: AdminMemberInviteCodeRow["created_by_profile"]
): string {
  if (!p) return "Unknown";
  return displayNameForAdminDetail({
    dj_name: p.dj_name,
    brand_name: p.brand_name,
    first_name: p.first_name,
    last_name: p.last_name,
    email: p.email,
  });
}

export function socialUrlForPlatform(
  platform: "instagram" | "soundcloud",
  handle: string
): string {
  if (!handle?.trim()) return "";
  const h = handle.trim();
  if (h.startsWith("http")) return h;
  if (platform === "instagram") {
    return instagramHandleToStored(instagramStoredToHandle(h));
  }
  return soundcloudHandleToStored(soundcloudStoredToHandle(h));
}
