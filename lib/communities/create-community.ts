import { supabase } from "@/integrations/supabase/client";
import { syncCommunityMemberCount } from "./community-detail-api";

export type CommunityCreateMode = "publish" | "draft";

export type CommunityCreateFormInput = {
  name: string;
  description: string;
  imageUrl: string | null;
  location: string;
};

export type CreateCommunityResult =
  | { ok: true; communityId: string; memberSetupIssue?: string }
  | {
      ok: false;
      code: "auth" | "profile" | "insert";
      message: string;
    };

/**
 * Creates a community row. `publish` adds the creator as admin and syncs member_count.
 * `draft` only inserts the row (member_count 0, no membership) so you can list it and finish setup later.
 */
export async function createCommunityWithSetup(params: {
  form: CommunityCreateFormInput;
  mode: CommunityCreateMode;
}): Promise<CreateCommunityResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      code: "auth",
      message: "You must be logged in to create a community.",
    };
  }

  const { data: userProfile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (profileError || !userProfile) {
    return {
      ok: false,
      code: "profile",
      message: "User profile not found. Please complete your profile first.",
    };
  }

  const { data, error } = await supabase
    .from("communities")
    .insert([
      {
        name: params.form.name.trim(),
        description: params.form.description.trim() || null,
        image_url: params.form.imageUrl,
        created_by: user.id,
        member_count: 0,
        location: params.form.location,
      },
    ])
    .select("id")
    .single();

  if (error || !data) {
    return {
      ok: false,
      code: "insert",
      message: error?.message || "Failed to create community.",
    };
  }

  const communityId = data.id as string;

  if (params.mode === "publish") {
    const { error: memberError } = await supabase.from("community_members").insert([
      {
        community_id: communityId,
        user_id: user.id,
        role: "admin",
        joined_at: new Date().toISOString(),
      },
    ]);

    let memberSetupIssue: string | undefined;
    if (memberError) {
      memberSetupIssue =
        "Community was created but adding you as admin failed. You can fix membership from the admin tools.";
    }

    await syncCommunityMemberCount(communityId);

    return { ok: true, communityId, memberSetupIssue };
  }

  return { ok: true, communityId };
}
