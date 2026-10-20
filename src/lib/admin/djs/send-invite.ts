import { upsertContactFromInvite } from "@/lib/crm/service";
import { recordDjInvite } from "@/lib/admin/djs/record-invite";

export type SendDjInviteResult =
  | { ok: true; autoApproved: boolean; crmUpdated: boolean; recorded: boolean }
  | { ok: false; message: string };

/**
 * Emails a DJ invite (App Store link, skips the waitlist), moves their Launch CRM
 * contact to Contacted, and records the invite so they're approved on sign-up.
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

  const response = await fetch("/api/notifications/dj-invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, message }),
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
  };
}
