import { NextResponse } from "next/server";
import { Resend } from "resend";
import { emailLogoBlock, emailAppStoreButtons, emailAppStorePlainText } from "@/lib/email/branding";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFromAddress =
  process.env.RESEND_FROM_EMAIL ?? "R/HOOD <hello@rhood.io>";

interface DjInvitePayload {
  email?: string;
  name?: string;
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
    const body = (await request.json()) as DjInvitePayload;
    const name = body.name?.trim() ?? "";
    const personalMessage = body.message?.trim() || "";

    if (!body.email || !name) {
      return NextResponse.json(
        { error: "Name and email are required." },
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
    const safeName = escapeHtml(name);
    const safeMessage = personalMessage
      ? `<tr><td style="padding-top:20px;font-size:15px;line-height:1.6;color:#dddddd;">${escapeHtml(personalMessage).replace(/\n/g, "<br/>")}</td></tr>`
      : "";

    const html = `
      <table style="width:100%;background-color:#0f0f0f;padding:32px 0;font-family:Helvetica,Arial,sans-serif;color:#ffffff;">
        <tr>
          <td align="center">
            <table style="width:560px;background-color:#1a1a1a;border-radius:16px;padding:40px;">
              ${emailLogoBlock("R/HOOD For DJs")}
              <tr>
                <td style="padding-top:24px;font-size:28px;font-weight:700;line-height:1.3;">You're invited to join as a DJ</td>
              </tr>
              <tr>
                <td style="padding-top:16px;font-size:16px;line-height:1.6;color:#dddddd;">
                  ${safeName}, you've been invited to create a DJ account on R/HOOD.<br/><br/>
                  Open this email on your mobile phone, then download the R/HOOD app from the App Store or Google Play. Because you were invited, you skip the waitlist and are approved as soon as you create your account with this email.
                </td>
              </tr>
              ${safeMessage}
              <tr>
                <td style="padding-top:32px;">
                  ${emailAppStoreButtons()}
                </td>
              </tr>
              <tr>
                <td style="padding-top:28px;font-size:13px;line-height:1.6;color:#9e9e9e;">
                  R/HOOD for DJs is a mobile app. Open this invite on your phone, install the app, create your account with this email, and start applying to opportunities.
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
      `You're invited to join R/HOOD as a DJ (${name}).`,
      "Open this email on your mobile phone, then download the R/HOOD app from the App Store or Google Play. Because you were invited, you skip the waitlist when you sign up with this email.",
      personalMessage ? `\n${personalMessage}\n` : "",
      emailAppStorePlainText(),
      "R/HOOD for DJs is a mobile app. Open this invite on your phone, install the app, create your account with this email, and start applying to opportunities.",
    ]
      .filter(Boolean)
      .join("\n");

    const emailResponse = await resend.emails.send({
      from: defaultFromAddress,
      to: sanitizedEmail,
      subject: `You're invited to R/HOOD - ${name}`,
      html,
      text,
    });

    if (emailResponse.error) {
      console.error("[Resend] DJ invite email failed:", emailResponse.error);
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
    console.error("[Resend] Unexpected DJ invite error:", error);
    return NextResponse.json(
      {
        error: "Failed to send DJ invite email",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
