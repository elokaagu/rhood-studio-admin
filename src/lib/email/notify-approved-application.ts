import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { recordCampaignMessage } from "@/lib/campaigns/store-message";
import { buildApprovalIntroduction } from "@/lib/email/approval-introduction";
import {
  emailAppStoreButtons,
  emailAppStorePlainText,
  emailLogoBlock,
} from "@/lib/email/branding";
import {
  displayName,
  escapeHtml,
  isValidEmail,
  sanitizeEmail,
} from "@/lib/email/helpers";
import { campaignAgentFromAddress, campaignOpsEmail } from "@/lib/email/ops";
import { formatCompensationDisplay } from "@/lib/opportunities/compensation";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFromAddress =
  process.env.RESEND_FROM_EMAIL ?? "R/HOOD <hello@rhood.io>";

export type NotifyApprovedApplicationInput = {
  applicationId?: string | null;
  applicationType?: "simple" | "form_response" | string | null;
  opportunityId?: string | null;
  organizerId?: string | null;
  djUserId?: string | null;
  djEmail?: string | null;
  djName?: string | null;
  opportunityTitle?: string | null;
};

type ProfileRow = {
  id?: string | null;
  email?: string | null;
  dj_name?: string | null;
  brand_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  role?: string | null;
};

function serviceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function fromUntyped(admin: SupabaseClient, table: string) {
  return (admin as unknown as { from: (name: string) => any }).from(table);
}

function eventDateLabel(row: {
  event_date?: string | null;
  event_start_time?: string | null;
  event_timezone?: string | null;
}): string | null {
  const raw = row.event_start_time || row.event_date;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: row.event_timezone || undefined,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }
}

async function resolveEmail(
  admin: SupabaseClient,
  profile: ProfileRow | null | undefined,
  userId?: string | null
): Promise<string | null> {
  const provided = profile?.email?.trim();
  if (provided && isValidEmail(provided) && provided.toLowerCase() !== "unknown") {
    return sanitizeEmail(provided);
  }
  if (!userId) return null;
  const { data: authUser, error } = await admin.auth.admin.getUserById(userId);
  if (error) {
    console.warn("[Resend] Auth email lookup failed:", error.message);
    return null;
  }
  const authEmail = authUser.user?.email?.trim();
  if (authEmail && isValidEmail(authEmail)) {
    return sanitizeEmail(authEmail);
  }
  return null;
}

async function loadProfile(
  admin: SupabaseClient,
  userId: string | null | undefined
): Promise<ProfileRow | null> {
  if (!userId) return null;
  const { data } = await fromUntyped(admin, "user_profiles")
    .select("id, email, dj_name, brand_name, first_name, last_name, role")
    .eq("id", userId)
    .maybeSingle();
  return (data as ProfileRow | null) ?? null;
}

async function alreadySent(
  admin: SupabaseClient,
  type: string,
  relatedId: string
): Promise<boolean> {
  try {
    const { data } = await fromUntyped(admin, "notifications")
      .select("id")
      .eq("type", type)
      .eq("related_id", relatedId)
      .limit(1)
      .maybeSingle();
    return Boolean(data?.id);
  } catch {
    return false;
  }
}

/** An outbound intro is already on this application's campaign thread. */
async function introOnCampaignThread(
  admin: SupabaseClient,
  applicationId: string | null | undefined
): Promise<boolean> {
  if (!applicationId) return false;
  try {
    const { data: thread } = await fromUntyped(admin, "campaign_threads")
      .select("id")
      .eq("application_id", applicationId)
      .limit(1)
      .maybeSingle();
    if (!thread?.id) return false;
    const { data: message } = await fromUntyped(admin, "campaign_messages")
      .select("id")
      .eq("thread_id", thread.id)
      .eq("direction", "outbound")
      .limit(1)
      .maybeSingle();
    return Boolean(message?.id);
  } catch {
    return false;
  }
}

async function markSent(
  admin: SupabaseClient,
  userId: string | null | undefined,
  type: string,
  relatedId: string,
  title: string,
  message: string
) {
  if (!userId) return;
  const { error } = await fromUntyped(admin, "notifications").insert({
    user_id: userId,
    type,
    related_id: relatedId,
    title,
    message,
    is_read: false,
  });
  if (error) {
    console.warn("[Resend] Could not record email send:", error.message);
  }
}

async function fetchApplicationRow(
  admin: SupabaseClient,
  applicationId: string,
  applicationType?: string | null
): Promise<{ opportunity_id?: string | null; user_id?: string | null } | null> {
  const preferred =
    applicationType === "form_response" ? "application_form_responses" : "applications";
  const tables =
    preferred === "application_form_responses"
      ? ["application_form_responses", "applications"]
      : ["applications", "application_form_responses"];

  for (const table of tables) {
    const { data, error } = await fromUntyped(admin, table)
      .select("opportunity_id, user_id")
      .eq("id", applicationId)
      .maybeSingle();
    if (error && (String(error.message || "").includes("does not exist") || error.code === "42P01")) {
      continue;
    }
    if (data) return data;
  }
  return null;
}

export async function notifyApprovedApplication(
  input: NotifyApprovedApplicationInput
): Promise<{
  ok: boolean;
  decisionSent: boolean;
  introSent: boolean;
  message?: string;
}> {
  const admin = serviceClient();
  if (!admin) {
    return { ok: false, decisionSent: false, introSent: false, message: "Supabase is not configured." };
  }
  if (!resendApiKey) {
    return {
      ok: false,
      decisionSent: false,
      introSent: false,
      message: "RESEND_API_KEY is not configured.",
    };
  }

  let opportunityId = input.opportunityId?.trim() || null;
  let djUserId = input.djUserId?.trim() || null;
  const applicationId = input.applicationId?.trim() || null;

  if (applicationId && (!opportunityId || !djUserId)) {
    const row = await fetchApplicationRow(admin, applicationId, input.applicationType);
    opportunityId = opportunityId || row?.opportunity_id || null;
    djUserId = djUserId || row?.user_id || null;
  }

  let organizerId = input.organizerId?.trim() || null;
  let opportunityTitle = input.opportunityTitle?.trim() || null;
  let location: string | null = null;
  let dateLabel: string | null = null;
  let additionalInfo: string | null = null;
  let compensation: string | null = null;
  let createdBy: string | null = null;
  let postedBy: string | null = null;
  let organizerName: string | null = null;

  if (opportunityId) {
    const full = await fromUntyped(admin, "opportunities")
      .select(
        "id, title, organizer_id, organizer_name, created_by, posted_by, location, event_date, event_start_time, event_timezone, additional_info, compensation, payment"
      )
      .eq("id", opportunityId)
      .maybeSingle();
    const opp =
      full.error
        ? await fromUntyped(admin, "opportunities")
            .select("id, title, organizer_id, organizer_name, location")
            .eq("id", opportunityId)
            .maybeSingle()
        : full;
    const row = (opp.data ?? null) as Record<string, unknown> | null;
    if (row) {
      organizerId = organizerId || (typeof row.organizer_id === "string" ? row.organizer_id : null);
      createdBy = typeof row.created_by === "string" ? row.created_by : null;
      postedBy = typeof row.posted_by === "string" ? row.posted_by : null;
      organizerName =
        typeof row.organizer_name === "string" ? row.organizer_name : null;
      opportunityTitle =
        opportunityTitle || (typeof row.title === "string" ? row.title : null);
      location = typeof row.location === "string" ? row.location : null;
      additionalInfo =
        typeof row.additional_info === "string" ? row.additional_info : null;
      compensation =
        formatCompensationDisplay(
          typeof row.compensation === "string" ? row.compensation : null,
          typeof row.payment === "number" ? row.payment : null
        ) || null;
      dateLabel = eventDateLabel({
        event_date: typeof row.event_date === "string" ? row.event_date : null,
        event_start_time:
          typeof row.event_start_time === "string" ? row.event_start_time : null,
        event_timezone:
          typeof row.event_timezone === "string" ? row.event_timezone : null,
      });
    }
  }

  const djProfile = await loadProfile(admin, djUserId);
  const brandProfile =
    (await loadProfile(admin, organizerId)) ||
    (await loadProfile(admin, createdBy)) ||
    (await loadProfile(admin, postedBy));

  const djEmail =
    (await resolveEmail(admin, djProfile, djUserId)) ||
    (input.djEmail && isValidEmail(input.djEmail) ? sanitizeEmail(input.djEmail) : null);
  const brandEmail = await resolveEmail(
    admin,
    brandProfile,
    organizerId || createdBy || postedBy
  );

  const djName = input.djName?.trim() || displayName(djProfile ?? {});
  const brandName =
    brandProfile?.brand_name?.trim() ||
    organizerName?.trim() ||
    displayName(brandProfile ?? {});
  const title = opportunityTitle || "this opportunity";
  const relatedId =
    applicationId ||
    (opportunityId && djUserId ? `${opportunityId}:${djUserId}` : null) ||
    `${title}:${djEmail || "dj"}`;

  const resend = new Resend(resendApiKey);
  let decisionSent = false;
  let introSent = false;

  if (djEmail && !(await alreadySent(admin, "application_approved_email", relatedId))) {
    const first = djName.trim().split(/\s+/)[0] || "there";
    const safeName = escapeHtml(first);
    const safeTitle = escapeHtml(title);
    const html = `
      <table style="width:100%;background-color:#0f0f0f;padding:32px 0;font-family:Helvetica,Arial,sans-serif;color:#ffffff;">
        <tr>
          <td align="center">
            <table style="width:560px;background-color:#1a1a1a;border-radius:16px;padding:40px;">
              ${emailLogoBlock("R/HOOD")}
              <tr>
                <td style="padding-top:24px;font-size:28px;font-weight:700;line-height:1.3;">You've been selected!</td>
              </tr>
              <tr>
                <td style="padding-top:16px;font-size:16px;line-height:1.6;color:#dddddd;">
                  Hey ${safeName},<br/><br/>
                  Great news — your application for "${safeTitle}" has been approved. We're also introducing you to the brand on a shared email thread so you can lock in the details.
                </td>
              </tr>
              <tr>
                <td style="padding-top:32px;">
                  ${emailAppStoreButtons("View in the R/HOOD app")}
                </td>
              </tr>
            </table>
            <table style="width:560px;padding:24px 0;color:#666666;font-size:12px;">
              <tr>
                <td align="center">© ${new Date().getFullYear()} R/HOOD. All rights reserved.</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
    const text = `Hey ${first},\n\nGreat news — your application for "${title}" has been approved. We're also introducing you to the brand on a shared email thread.\n\n${emailAppStorePlainText("View in the R/HOOD app")}`;
    const decision = await resend.emails.send({
      from: defaultFromAddress,
      to: djEmail,
      subject: `Your application for ${title} was approved`,
      html,
      text,
      headers: {
        "X-Entity-Ref-ID": `approved-${relatedId}`.replace(/\s+/g, "-").slice(0, 50),
      },
    });
    if (decision.error) {
      console.error("[Resend] Approval email failed:", decision.error);
      return {
        ok: false,
        decisionSent: false,
        introSent: false,
        message: decision.error.message || "Failed to send approval email.",
      };
    }
    decisionSent = true;
    await markSent(
      admin,
      djUserId,
      "application_approved_email",
      relatedId,
      "Application approved",
      `Your application for "${title}" was approved.`
    );
  } else if (djEmail) {
    decisionSent = true;
  }

  if (!decisionSent) {
    return {
      ok: false,
      decisionSent: false,
      introSent: false,
      message: "A valid DJ email is required to send the approval.",
    };
  }

  if (!djEmail || !brandEmail || brandEmail === djEmail) {
    return {
      ok: true,
      decisionSent,
      introSent: false,
      message:
        !djEmail
          ? "A valid DJ email is required to send the introduction."
          : !brandEmail
            ? "Brand has no email."
            : "Skipped intro for the same email.",
    };
  }

  if (
    (await alreadySent(admin, "application_intro", relatedId)) ||
    (await introOnCampaignThread(admin, applicationId))
  ) {
    return { ok: true, decisionSent, introSent: true };
  }

  const intro = buildApprovalIntroduction({
    djName,
    djEmail,
    brandName,
    brandEmail,
    opportunityTitle: title,
    location,
    eventDateLabel: dateLabel,
    additionalInfo,
    compensation,
  });

  const introResponse = await resend.emails.send({
    from: campaignAgentFromAddress(),
    to: intro.to,
    cc: intro.cc,
    replyTo: intro.replyTo,
    subject: intro.subject,
    html: intro.html,
    text: intro.text,
    headers: {
      "X-Entity-Ref-ID": `intro-${relatedId}`.replace(/\s+/g, "-").slice(0, 50),
    },
  });

  if (introResponse.error) {
    console.error("[Resend] Introduction email failed:", introResponse.error);
    return {
      ok: true,
      decisionSent,
      introSent: false,
      message: introResponse.error.message || "Failed to send introduction email.",
    };
  }

  introSent = true;
  await markSent(
    admin,
    organizerId || createdBy || postedBy || djUserId,
    "application_intro",
    relatedId,
    "Introduction sent",
    `${djName} and ${brandName} were introduced for ${title}.`
  );
  await recordCampaignMessage(admin, {
    opportunityId,
    applicationId,
    brandEmail,
    djEmail,
    subject: intro.subject,
    fromEmail: campaignOpsEmail(),
    toEmails: intro.to,
    ccEmails: intro.cc,
    bodyText: intro.text,
    direction: "outbound",
    resendId: introResponse.data?.id ?? null,
  });

  return { ok: true, decisionSent, introSent };
}
