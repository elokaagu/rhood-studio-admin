import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { emailLogoBlock } from "@/lib/email/branding";
import { getPortalBaseUrl } from "@/lib/portal-url";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFromAddress =
  process.env.RESEND_FROM_EMAIL ?? "R/HOOD <hello@rhood.io>";

export type BrandNewApplicationPayload = {
  applicationId?: string;
  opportunityId?: string | null;
  applicantUserId?: string | null;
  source?: string | null;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function displayName(row: {
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
  const full = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
  if (full) return full;
  return row.email?.trim() || "A DJ";
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function notifyBrandOfNewApplication(
  payload: BrandNewApplicationPayload
): Promise<{ ok: true; emailed: boolean } | { ok: false; message: string }> {
  const supabase = serviceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const source =
    payload.source === "application_form_responses"
      ? "application_form_responses"
      : "applications";

  let opportunityId = payload.opportunityId ?? null;
  let applicantUserId = payload.applicantUserId ?? null;
  const applicationId = payload.applicationId ?? null;

  if (applicationId && (!opportunityId || !applicantUserId)) {
    const table = source === "application_form_responses"
      ? "application_form_responses"
      : "applications";
    const { data: row } = await (supabase as unknown as {
      from: (name: string) => {
        select: (cols: string) => {
          eq: (col: string, value: string) => {
            maybeSingle: () => Promise<{
              data: { opportunity_id?: string | null; user_id?: string | null } | null;
            }>;
          };
        };
      };
    })
      .from(table)
      .select("opportunity_id, user_id")
      .eq("id", applicationId)
      .maybeSingle();
    opportunityId = opportunityId ?? row?.opportunity_id ?? null;
    applicantUserId = applicantUserId ?? row?.user_id ?? null;
  }

  if (!opportunityId || !applicantUserId) {
    return { ok: false, message: "Missing opportunity or applicant." };
  }

  const { data: opportunity, error: opportunityError } = await supabase
    .from("opportunities")
    .select("id, title, organizer_id")
    .eq("id", opportunityId)
    .maybeSingle();

  if (opportunityError || !opportunity?.organizer_id) {
    return {
      ok: false,
      message: opportunityError?.message || "Opportunity has no organiser.",
    };
  }

  const [{ data: brand }, { data: applicant }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("id, email, brand_name, first_name, last_name, role")
      .eq("id", opportunity.organizer_id)
      .maybeSingle(),
    supabase
      .from("user_profiles")
      .select("id, email, dj_name, first_name, last_name")
      .eq("id", applicantUserId)
      .maybeSingle(),
  ]);

  if (!brand?.email || !isValidEmail(brand.email)) {
    return { ok: false, message: "Brand has no valid email." };
  }

  if (brand.id === applicantUserId) {
    return { ok: true, emailed: false };
  }

  const relatedId = applicationId || `${opportunityId}:${applicantUserId}`;
  const { data: existing } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", brand.id)
    .eq("type", "opportunity_application")
    .eq("related_id", relatedId)
    .maybeSingle();

  if (existing?.id) {
    return { ok: true, emailed: false };
  }

  const applicantName = displayName(applicant ?? {});
  const opportunityTitle = opportunity.title?.trim() || "your opportunity";
  const brandName =
    brand.brand_name?.trim() || brand.first_name?.trim() || "there";

  await supabase.from("notifications").insert({
    user_id: brand.id,
    title: "New application",
    message: `${applicantName} applied to ${opportunityTitle}.`,
    type: "opportunity_application",
    related_id: relatedId,
    is_read: false,
  });

  if (!resendApiKey) {
    console.error("[Resend] RESEND_API_KEY is not configured");
    return { ok: true, emailed: false };
  }

  const portalUrl = `${getPortalBaseUrl()}/admin/applications`;
  const firstName = brandName.split(" ")[0];
  const safeApplicant = escapeHtml(applicantName);
  const safeTitle = escapeHtml(opportunityTitle);
  const safeBrand = escapeHtml(firstName);

  const html = `
      <table style="width:100%;background-color:#0f0f0f;padding:32px 0;font-family:Helvetica,Arial,sans-serif;color:#ffffff;">
        <tr>
          <td align="center">
            <table style="width:560px;background-color:#1a1a1a;border-radius:16px;padding:40px;">
              ${emailLogoBlock("R/HOOD Studio")}
              <tr>
                <td style="padding-top:24px;font-size:28px;font-weight:700;line-height:1.3;">New application</td>
              </tr>
              <tr>
                <td style="padding-top:16px;font-size:16px;line-height:1.6;color:#dddddd;">
                  Hey ${safeBrand},<br/><br/>
                  <strong>${safeApplicant}</strong> just applied to <strong>${safeTitle}</strong>.
                </td>
              </tr>
              <tr>
                <td style="padding-top:32px;">
                  <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;background-color:#c2cc06;color:#1d1d1b;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;">Review applications</a>
                </td>
              </tr>
              <tr>
                <td style="padding-top:28px;font-size:13px;line-height:1.6;color:#9e9e9e;">
                  Open Studio to shortlist, approve, or pass. You can also find this under Applications in the sidebar.
                </td>
              </tr>
            </table>
            <table style="width:560px;padding:24px 0;color:#666666;font-size:12px;">
              <tr>
                <td align="center">
                  © ${new Date().getFullYear()} R/HOOD. All rights reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

  const text = `Hey ${firstName},\n\n${applicantName} just applied to "${opportunityTitle}".\n\nReview applications: ${portalUrl}`;

  const resend = new Resend(resendApiKey);
  const emailResponse = await resend.emails.send({
    from: defaultFromAddress,
    to: sanitizeEmail(brand.email),
    subject: `New application: ${opportunityTitle}`,
    html,
    text,
    headers: {
      "X-Entity-Ref-ID": `opp-app-${relatedId}`.replace(/\s+/g, "-").slice(0, 50),
    },
  });

  if (emailResponse.error) {
    console.error("[Resend] Brand application email failed:", emailResponse.error);
    return {
      ok: false,
      message: emailResponse.error.message || "Failed to send email.",
    };
  }

  return { ok: true, emailed: true };
}
