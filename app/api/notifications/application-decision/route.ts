import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  emailLogoBlock,
  emailAppStoreButtons,
  emailAppStorePlainText,
} from "@/lib/email/branding";
import { notifyApprovedApplication } from "@/lib/email/notify-approved-application";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFromAddress =
  process.env.RESEND_FROM_EMAIL ?? "R/HOOD <hello@rhood.io>";

interface ApplicationDecisionPayload {
  email?: string;
  applicantName?: string | null;
  status?: string;
  opportunityTitle?: string;
  userId?: string | null;
  applicationId?: string | null;
  applicationType?: string | null;
  opportunityId?: string | null;
  organizerId?: string | null;
}

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

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function resolveRecipientEmail(
  email: string | undefined,
  userId: string | undefined
): Promise<string | null> {
  const provided = email?.trim();
  if (provided && isValidEmail(provided) && provided.toLowerCase() !== "unknown") {
    return sanitizeEmail(provided);
  }

  if (!userId) return null;

  const supabase = serviceClient();
  if (!supabase) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  const profileEmail = profile?.email?.trim();
  if (profileEmail && isValidEmail(profileEmail)) {
    return sanitizeEmail(profileEmail);
  }

  const { data: authUser, error } = await supabase.auth.admin.getUserById(userId);
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApplicationDecisionPayload;

    if (!body.status || !body.opportunityTitle) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: {
            status: !body.status ? "Status is required" : undefined,
            opportunityTitle: !body.opportunityTitle
              ? "Opportunity title is required"
              : undefined,
          },
        },
        { status: 400 }
      );
    }

    if (body.status !== "approved" && body.status !== "rejected") {
      return NextResponse.json(
        { error: "Status must be either 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    const sanitizedEmail = await resolveRecipientEmail(
      body.email,
      body.userId?.trim() || undefined
    );
    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: "A valid applicant email or userId is required" },
        { status: 400 }
      );
    }

    if (!resendApiKey) {
      console.error(
        "[Resend] RESEND_API_KEY is not configured in environment variables"
      );
      return NextResponse.json(
        {
          error: "Email service not configured",
          message: "RESEND_API_KEY environment variable is missing",
        },
        { status: 503 }
      );
    }

    if (!resendApiKey.startsWith("re_")) {
      console.warn(
        "[Resend] RESEND_API_KEY format appears invalid (should start with 're_')"
      );
    }

    const approved = body.status === "approved";
    if (approved) {
      const result = await notifyApprovedApplication({
        applicationId: body.applicationId,
        applicationType: body.applicationType,
        opportunityId: body.opportunityId,
        organizerId: body.organizerId,
        djUserId: body.userId,
        djEmail: sanitizedEmail,
        djName: body.applicantName,
        opportunityTitle: body.opportunityTitle,
      });
      if (!result.ok && !result.decisionSent) {
        return NextResponse.json(
          {
            error: "Failed to send email",
            message: result.message || "Failed to send approval email.",
          },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        previewText: result.introSent
          ? "Approved — the brand and DJ are on a shared intro thread"
          : "Your application was approved — view it in the R/HOOD app",
        introSent: result.introSent,
        to: sanitizedEmail,
      });
    }

    const resend = new Resend(resendApiKey);
    const firstName = body.applicantName?.trim().split(" ")[0] || "there";
    const safeName = escapeHtml(firstName);
    const safeTitle = escapeHtml(body.opportunityTitle);
    const subject = `Update on ${body.opportunityTitle}`;
    const heroHeading = "Thanks for applying";
    const bodyCopy = `Thanks for putting yourself forward for "${safeTitle}". The organiser went in a different direction this time, but we'd love to see you apply again.`;
    const plainBodyCopy = `Thanks for putting yourself forward for "${body.opportunityTitle}". The organiser went in a different direction this time, but we'd love to see you apply again.`;
    const ctaLabel = "Find more gigs in the app";
    const previewText = "You're still on our radar — check other live gigs in the app.";

    const html = `
      <table style="width:100%;background-color:#0f0f0f;padding:32px 0;font-family:Helvetica,Arial,sans-serif;color:#ffffff;">
        <tr>
          <td align="center">
            <table style="width:560px;background-color:#1a1a1a;border-radius:16px;padding:40px;">
              ${emailLogoBlock("R/HOOD")}
              <tr>
                <td style="padding-top:24px;font-size:28px;font-weight:700;line-height:1.3;">${heroHeading}</td>
              </tr>
              <tr>
                <td style="padding-top:16px;font-size:16px;line-height:1.6;color:#dddddd;">
                  Hey ${safeName},<br/><br/>${bodyCopy}
                </td>
              </tr>
              <tr>
                <td style="padding-top:32px;">
                  ${emailAppStoreButtons(ctaLabel)}
                </td>
              </tr>
              <tr>
                <td style="padding-top:28px;font-size:13px;line-height:1.6;color:#9e9e9e;">
                  This notification was sent because your application for <strong>${safeTitle}</strong> was marked as ${body.status}.<br/>
                  Open the R/HOOD app on your phone for the latest updates. Need help? Reply to this email.
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

    const text = `Hey ${firstName},\n\n${plainBodyCopy}\n\n${emailAppStorePlainText(ctaLabel)}`;

    const emailResponse = await resend.emails.send({
      from: defaultFromAddress,
      to: sanitizedEmail,
      subject,
      html,
      text,
      headers: {
        "X-Entity-Ref-ID": `${body.status}-${body.opportunityTitle}`
          .replace(/\s+/g, "-")
          .toLowerCase()
          .substring(0, 50),
      },
    });

    if (emailResponse.error) {
      console.error("[Resend] Email send failed:", emailResponse.error);
      return NextResponse.json(
        {
          error: "Failed to send email",
          message: emailResponse.error.message || "Unknown Resend API error",
          details: emailResponse.error,
        },
        { status: 500 }
      );
    }

    console.log(
      `[Resend] Application decision email sent successfully to ${sanitizedEmail} (${body.status})`
    );

    return NextResponse.json({
      success: true,
      previewText,
      emailId: emailResponse.data?.id,
      to: sanitizedEmail,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error("[Resend] Error sending email:", {
        message: error.message,
        stack: error.stack,
      });

      if (error.message.includes("API key")) {
        return NextResponse.json(
          {
            error: "Invalid API key",
            message: "The Resend API key appears to be invalid or expired",
          },
          { status: 401 }
        );
      }

      if (error.message.includes("domain") || error.message.includes("from")) {
        return NextResponse.json(
          {
            error: "Invalid sender address",
            message:
              "The 'from' email address is not verified in your Resend account",
            suggestion:
              "Verify your domain or use a verified email address in RESEND_FROM_EMAIL",
          },
          { status: 400 }
        );
      }
    }

    console.error("[Resend] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Failed to send application decision email",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
