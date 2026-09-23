import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeEmail } from "@/lib/email/helpers";
import { uniqueEmails } from "@/lib/email/ops";

function fromUntyped(admin: SupabaseClient, table: string) {
  return (admin as unknown as { from: (name: string) => any }).from(table);
}

export type CampaignMessageInput = {
  opportunityId?: string | null;
  applicationId?: string | null;
  brandEmail?: string | null;
  djEmail?: string | null;
  subject?: string | null;
  fromEmail?: string | null;
  toEmails?: string[];
  ccEmails?: string[];
  bodyText?: string | null;
  direction: "inbound" | "outbound";
  resendId?: string | null;
};

function tableMissing(message: string | undefined) {
  const text = (message || "").toLowerCase();
  return (
    text.includes("campaign_threads") ||
    text.includes("campaign_messages") ||
    text.includes("does not exist")
  );
}

function subjectKey(value: string | null | undefined): string {
  return (value || "")
    .replace(/^(re|fwd|fw)\s*:\s*/gi, "")
    .trim()
    .toLowerCase();
}

export async function recordCampaignMessage(
  admin: SupabaseClient,
  input: CampaignMessageInput
): Promise<void> {
  const applicationId = input.applicationId?.trim() || null;
  const opportunityId = input.opportunityId?.trim() || null;
  const brandEmail = input.brandEmail ? sanitizeEmail(input.brandEmail) : null;
  const djEmail = input.djEmail ? sanitizeEmail(input.djEmail) : null;
  const subject = input.subject?.trim() || null;
  const fromEmail = input.fromEmail ? sanitizeEmail(input.fromEmail) : null;
  const participants = uniqueEmails(
    fromEmail,
    brandEmail,
    djEmail,
    ...(input.toEmails || []),
    ...(input.ccEmails || [])
  );

  let threadId: string | null = null;

  if (applicationId) {
    const existing = await fromUntyped(admin, "campaign_threads")
      .select("id")
      .eq("application_id", applicationId)
      .maybeSingle();
    if (existing.error && tableMissing(existing.error.message)) return;
    threadId = existing.data?.id ?? null;
  }

  if (!threadId) {
    const listed = await fromUntyped(admin, "campaign_threads")
      .select("id, subject, brand_email, dj_email")
      .order("last_activity_at", { ascending: false })
      .limit(200);
    if (listed.error && tableMissing(listed.error.message)) return;
    const threads = (listed.data || []) as Array<{
      id: string;
      subject: string | null;
      brand_email: string | null;
      dj_email: string | null;
    }>;
    const wantedSubject = subjectKey(subject);
    const match =
      threads.find((thread) => {
        const partyHit =
          (thread.brand_email &&
            participants.includes(sanitizeEmail(thread.brand_email))) ||
          (thread.dj_email &&
            participants.includes(sanitizeEmail(thread.dj_email)));
        const subjectHit =
          wantedSubject && subjectKey(thread.subject) === wantedSubject;
        return Boolean(subjectHit && (partyHit || !thread.brand_email));
      }) ||
      threads.find((thread) => {
        return (
          thread.brand_email &&
          participants.includes(sanitizeEmail(thread.brand_email)) &&
          thread.dj_email &&
          participants.includes(sanitizeEmail(thread.dj_email))
        );
      }) ||
      threads.find((thread) => {
        if (!fromEmail) return false;
        return (
          (thread.brand_email &&
            sanitizeEmail(thread.brand_email) === fromEmail) ||
          (thread.dj_email && sanitizeEmail(thread.dj_email) === fromEmail)
        );
      });
    threadId = match?.id ?? null;
  }

  if (!threadId) {
    const inserted = await fromUntyped(admin, "campaign_threads")
      .insert({
        opportunity_id: opportunityId,
        application_id: applicationId,
        brand_email: brandEmail,
        dj_email: djEmail,
        subject,
        last_activity_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (inserted.error) {
      if (tableMissing(inserted.error.message)) return;
      console.warn("[campaigns] thread insert", inserted.error.message);
      return;
    }
    threadId = inserted.data?.id ?? null;
  } else {
    await fromUntyped(admin, "campaign_threads")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("id", threadId);
  }

  if (!threadId) return;

  const { error } = await fromUntyped(admin, "campaign_messages").insert({
    thread_id: threadId,
    direction: input.direction,
    from_email: fromEmail,
    to_emails: input.toEmails ?? [],
    cc_emails: input.ccEmails ?? [],
    subject,
    body_text: input.bodyText?.slice(0, 8000) || null,
    resend_id: input.resendId || null,
    received_at: new Date().toISOString(),
  });
  if (error && !tableMissing(error.message)) {
    console.warn("[campaigns] message insert", error.message);
  }
}
