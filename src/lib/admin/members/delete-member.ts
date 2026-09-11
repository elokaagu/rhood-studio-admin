import { supabase } from "@/integrations/supabase/client";

export async function deleteAdminMember(
  userId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!userId?.trim()) {
    return { ok: false, message: "Missing member id." };
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    return { ok: false, message: "Not authenticated." };
  }

  try {
    const response = await fetch("/api/admin/delete-member", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId: userId.trim() }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      return { ok: false, message: payload.error || "Failed to delete member." };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Failed to delete member." };
  }
}
