import { upsertContactFromInvite } from "@/lib/crm/service";
import { recordDjInvite } from "@/lib/admin/djs/record-invite";
import { supabase } from "@/integrations/supabase/client";

export type SendDjInviteResult =
  | {
      ok: true;
      autoApproved: boolean;
      crmUpdated: boolean;
      recorded: boolean;
      inviteCode: string | null;
    }
  | { ok: false; message: string };

async function createDjInviteCode(label: string): Promise<string | null> {
  const { data, error } = await (
    supabase as unknown as {
      rpc: (
        fn: string,
        args?: Record<string, unknown>
      ) => Promise<{ data: { code?: string } | null; error: { message: string } | null }>;
    }
  ).rpc("create_dj_invite_code", {
    p_label: label,
    p_expires_in_days: 30,
  });
  if (error || !data?.code) {
    console.warn("[sendDjInvite] Could not create invite code:", error?.message);
    return null;
  }
  return data.code;
}

/**
 * Creates a DJ invite code, emails App Store + code (skips waitlist), moves their
 * Launch CRM contact to Contacted, and records the invite for email-based approval.
 */
export async function sendDjInvite(params: {
  name: string;
  email: string;
  message?: string | null;
}): Promise<SendDjInviteResult> {
  const name = params.name.trim();
  const email = params.email.trim();
  const message = params.message?.trim() || null;
  if (!name || !email) return { ok: false, message: "Name and email are required." };

  const inviteCode = await createDjInviteCode(name);

  const response = await fetch("/api/notifications/dj-invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, message, inviteCode }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    message?: string;
    error?: string;
  };
  if (!response.ok) {
    return {
      ok: false,
      message: payload.message || payload.error || "The invitation email could not be sent.",
    };
  }

  const crm = await upsertContactFromInvite({
    name,
    email,
    category: "DJ",
    note: message || "Invited to join R/HOOD as a DJ.",
  });
  const recorded = await recordDjInvite({ name, email, message });

  return {
    ok: true,
    autoApproved: recorded.ok ? recorded.autoApproved : false,
    crmUpdated: crm.ok,
    recorded: recorded.ok,
    inviteCode,
  };
}
