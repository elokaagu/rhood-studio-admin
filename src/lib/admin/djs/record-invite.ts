import { supabase } from "@/integrations/supabase/client";
import { setDjMembershipStatus } from "@/lib/admin/dj-applications/service";

export async function recordDjInvite(params: {
  name: string;
  email: string;
  message?: string | null;
}): Promise<{ ok: true; autoApproved: boolean } | { ok: false; message: string }> {
  const email = params.email.trim().toLowerCase();
  const name = params.name.trim();
  if (!email || !name) {
    return { ok: false, message: "Name and email are required." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload = {
    email,
    name,
    message: params.message?.trim() || null,
    invited_by: user?.id ?? null,
  };

  const existing = await supabase
    .from("dj_invites")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (existing.error && !existing.error.message?.toLowerCase().includes("dj_invites")) {
    return { ok: false, message: existing.error.message };
  }

  if (existing.error?.message?.toLowerCase().includes("dj_invites")) {
    return {
      ok: false,
      message:
        "DJ invite table is not in the live database yet. Run supabase/migrations/20260910180000_dj_membership_approval.sql.",
    };
  }

  if (existing.data?.id) {
    const { error } = await supabase
      .from("dj_invites")
      .update({
        name,
        message: payload.message,
        invited_by: payload.invited_by,
      })
      .eq("id", existing.data.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("dj_invites").insert(payload);
    if (error) return { ok: false, message: error.message };
  }

  const profile = await supabase
    .from("user_profiles")
    .select("id, role, membership_status")
    .ilike("email", email)
    .maybeSingle();

  const row = profile.data as
    | { id: string; role: string | null; membership_status?: string | null }
    | null;

  if (row && (row.role === "dj" || row.role == null)) {
    if (row.membership_status !== "approved") {
      const result = await setDjMembershipStatus(row.id, "approved", "invite");
      if (!result.ok) return result;
    }

    await supabase
      .from("dj_invites")
      .update({ used_at: new Date().toISOString(), used_by: row.id })
      .ilike("email", email)
      .is("used_at", null);

    return { ok: true, autoApproved: row.membership_status !== "approved" };
  }

  return { ok: true, autoApproved: false };
}
