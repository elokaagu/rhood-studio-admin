import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { emailLogoBlock } from "@/lib/email/branding";
import { getPortalBaseUrl } from "@/lib/portal-url";
import { loginPathWithNext } from "@/lib/auth/login-redirect";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFromAddress =
  process.env.RESEND_FROM_EMAIL ?? "R/HOOD <hello@rhood.io>";
const defaultAlertRecipients = "hello@rhood.io,eloka@rhood.io";

export type NewDjApplicationPayload = {
  userId?: string | null;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function alertRecipients(): string[] {
  const raw = process.env.DJ_APPLICATION_ALERT_EMAILS?.trim() || defaultAlertRecipients;
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(isValidEmail);
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function notifyAdminsOfNewDjApplication(
  payload: NewDjApplicationPayload
): Promise<{ ok: true; emailed: boolean } | { ok: false; message: string }> {
  if (!payload.userId) {
    return { ok: false, message: "Missing userId." };
  }

  const supabase = serviceClient();
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("id, email, dj_name, first_name, last_name, city, role, membership_status")
    .eq("id", payload.userId)
    .maybeSingle();

  if (error || !profile) {
    return { ok: false, message: error?.message || "Profile not found." };
  }

  if (
    profile.membership_status !== "pending" ||
    (profile.role && profile.role !== "dj")
  ) {
    return { ok: true, emailed: false };
  }

  const recipients = alertRecipients();
  if (!resendApiKey || recipients.length === 0) {
    console.error("[Resend] DJ application alert not configured");
    return { ok: true, emailed: false };
  }

  const fullName = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
  const applicantName = profile.dj_name?.trim() || fullName || "A new DJ";
  const email = profile.email?.trim() || "";
  const isAppleRelay = /@privaterelay\.appleid\.com$/i.test(email);
  const emailLabel = isAppleRelay ? `${email} (Apple Hide My Email)` : email;
  const details = [
    fullName && fullName !== applicantName ? `Name: ${fullName}` : null,
    emailLabel ? `Email: ${emailLabel}` : null,
    profile.city?.trim() ? `City: ${profile.city.trim()}` : null,
  ].filter((line): line is string => Boolean(line));

  const portalUrl = `${getPortalBaseUrl()}${loginPathWithNext("/admin/dj-applications")}`;
  const safeName = escapeHtml(applicantName);
  const detailsHtml = details.map((line) => escapeHtml(line)).join("<br/>");

  const html = `
      <table style="width:100%;background-color:#0f0f0f;padding:32px 0;font-family:Helvetica,Arial,sans-serif;color:#ffffff;">
        <tr>
          <td align="center">
            <table style="width:560px;background-color:#1a1a1a;border-radius:16px;padding:40px;">
              ${emailLogoBlock("R/HOOD Studio")}
              <tr>
                <td style="padding-top:24px;font-size:28px;font-weight:700;line-height:1.3;">New DJ application</td>
              </tr>
              <tr>
                <td style="padding-top:16px;font-size:16px;line-height:1.6;color:#dddddd;">
                  <strong>${safeName}</strong> just applied to join R/HOOD and is waiting for review.
                  ${detailsHtml ? `<br/><br/><span style="font-size:14px;color:#bbbbbb;">${detailsHtml}</span>` : ""}
                </td>
              </tr>
              <tr>
                <td style="padding-top:32px;">
                  <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;background-color:#c2cc06;color:#1d1d1b;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;">Review DJ applications</a>
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

  const text = `${applicantName} just applied to join R/HOOD and is waiting for review.\n\n${details.join("\n")}\n\nReview DJ applications: ${portalUrl}`;

  const resend = new Resend(resendApiKey);
  const emailResponse = await resend.emails.send({
    from: defaultFromAddress,
    to: recipients,
    subject: `New DJ application: ${applicantName}`,
    html,
    text,
    headers: {
      "X-Entity-Ref-ID": `dj-app-${profile.id}`.slice(0, 50),
    },
  });

  if (emailResponse.error) {
    console.error("[Resend] DJ application alert failed:", emailResponse.error);
    return {
      ok: false,
      message: emailResponse.error.message || "Failed to send email.",
    };
  }

  return { ok: true, emailed: true };
}
