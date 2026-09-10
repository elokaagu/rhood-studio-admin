import { NextResponse } from "next/server";
import { Resend } from "resend";
import { emailLogoBlock } from "@/lib/email/branding";
import { getPortalBaseUrl } from "@/lib/portal-url";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFromAddress =
  process.env.RESEND_FROM_EMAIL ?? "R/HOOD <hello@rhood.io>";

interface BrandInvitePayload {
  email?: string;
  brandName?: string;
  inviteCode?: string;
  expiresAt?: string | null;
  message?: string | null;
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BrandInvitePayload;
    const brandName = body.brandName?.trim() ?? "";
    const inviteCode = body.inviteCode?.trim().toUpperCase() ?? "";
    const personalMessage = body.message?.trim() || "";

    if (!body.email || !brandName || !inviteCode) {
      return NextResponse.json(
        { error: "Email, brand name, and invite code are required." },
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeEmail(body.email);
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email address format" },
        { status: 400 }
      );
    }

    if (!resendApiKey) {
      console.error("[Resend] RESEND_API_KEY is not configured");
      return NextResponse.json(
        {
          error: "Email service not configured",
          message: "RESEND_API_KEY environment variable is missing",
        },
        { status: 503 }
      );
    }

    const resend = new Resend(resendApiKey);
    const portalUrl = getPortalBaseUrl();
    const signupParams = new URLSearchParams({
      signup: "brand",
      code: inviteCode,
      email: sanitizedEmail,
    });
    const signupUrl = `${portalUrl}/login?${signupParams.toString()}`;
    const expiryLabel = body.expiresAt
      ? new Date(body.expiresAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "the date set by the R/HOOD team";

    const safeBrand = escapeHtml(brandName);
    const safeCode = escapeHtml(inviteCode);
    const safeMessage = personalMessage
      ? `<tr><td style="padding-top:20px;font-size:15px;line-height:1.6;color:#dddddd;">${escapeHtml(personalMessage).replace(/\n/g, "<br/>")}</td></tr>`
      : "";

    const html = `
      <table style="width:100%;background-color:#0f0f0f;padding:32px 0;font-family:Helvetica,Arial,sans-serif;color:#ffffff;">
        <tr>
          <td align="center">
            <table style="width:560px;background-color:#1a1a1a;border-radius:16px;padding:40px;">
              ${emailLogoBlock("R/HOOD For Brands")}
              <tr>
                <td style="padding-top:24px;font-size:28px;font-weight:700;line-height:1.3;">You're invited to join as a brand</td>
              </tr>
              <tr>
                <td style="padding-top:16px;font-size:16px;line-height:1.6;color:#dddddd;">
                  ${safeBrand} has been invited to create a brand account on R/HOOD.
                </td>
              </tr>
              ${safeMessage}
              <tr>
                <td style="padding-top:24px;font-size:14px;letter-spacing:1px;text-transform:uppercase;color:#9e9e9e;">Invite code</td>
              </tr>
              <tr>
                <td style="padding-top:8px;font-size:28px;font-weight:700;letter-spacing:4px;color:#c2cc06;">${safeCode}</td>
              </tr>
              <tr>
                <td style="padding-top:32px;">
                  <a href="${signupUrl}" style="display:inline-block;padding:14px 28px;background-color:#c2cc06;color:#1d1d1b;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;">Create your account</a>
                </td>
              </tr>
              <tr>
                <td style="padding-top:28px;font-size:13px;line-height:1.6;color:#9e9e9e;">
                  This link opens brand signup with your invite code already filled in. It expires on ${escapeHtml(expiryLabel)}.
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

    const text = [
      `You're invited to join R/HOOD as a brand (${brandName}).`,
      personalMessage ? `\n${personalMessage}\n` : "",
      `Invite code: ${inviteCode}`,
      `Create your account: ${signupUrl}`,
      `This link opens brand signup with your invite code already filled in. It expires on ${expiryLabel}.`,
    ]
      .filter(Boolean)
      .join("\n");

    const emailResponse = await resend.emails.send({
      from: defaultFromAddress,
      to: sanitizedEmail,
      subject: `You're invited to R/HOOD ${brandName}`,
      html,
      text,
    });

    if (emailResponse.error) {
      console.error("[Resend] Brand invite email failed:", emailResponse.error);
      return NextResponse.json(
        {
          error: "Failed to send email",
          message: emailResponse.error.message || "Unknown Resend API error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: emailResponse.data?.id,
      to: sanitizedEmail,
    });
  } catch (error) {
    console.error("[Resend] Unexpected brand invite error:", error);
    return NextResponse.json(
      {
        error: "Failed to send brand invite email",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
