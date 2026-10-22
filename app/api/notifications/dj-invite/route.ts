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
  inviteCode?: string | null;
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
    const inviteCode = body.inviteCode?.trim().toUpperCase() || "";

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
    const safeCode = inviteCode ? escapeHtml(inviteCode) : "";
    const safeMessage = personalMessage
      ? `<tr><td style="padding-top:20px;font-size:15px;line-height:1.6;color:#dddddd;">${escapeHtml(personalMessage).replace(/\n/g, "<br/>")}</td></tr>`
      : "";

    const codeBlock = safeCode
      ? `<tr>
                <td style="padding-top:24px;">
                  <table style="width:100%;background-color:#111111;border:1px solid #c2cc06;border-radius:12px;padding:18px 20px;">
                    <tr>
                      <td style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#c2cc06;font-weight:700;padding-bottom:8px;">
                        Your invite code
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:28px;font-weight:700;letter-spacing:4px;color:#ffffff;font-family:Menlo,Monaco,Consolas,monospace;">
                        ${safeCode}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top:10px;font-size:14px;line-height:1.6;color:#dddddd;">
                        Download the app, create your account with this email, then enter this code to skip the waitlist.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`
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
                  Open this email on your iPhone, download R/HOOD from the App Store, then sign up with this email${safeCode ? " and enter your invite code" : ""}. You'll skip the waitlist and get in immediately.
                </td>
              </tr>
              ${codeBlock}
              ${safeMessage}
              <tr>
                <td style="padding-top:32px;">
                  ${emailAppStoreButtons()}
                </td>
              </tr>
              <tr>
                <td style="padding-top:28px;font-size:13px;line-height:1.6;color:#9e9e9e;">
                  R/HOOD for DJs is an iOS app. Open this invite on your iPhone, install from the App Store, create your account with this email${safeCode ? `, enter code ${safeCode}` : ""}, and start applying to opportunities.
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
      inviteCode
        ? `Invite code: ${inviteCode}\n\nOpen this email on your iPhone, download R/HOOD from the App Store, create your account with this email, then enter the invite code to skip the waitlist.`
        : "Open this email on your iPhone, download R/HOOD from the App Store, then create your account with this email to skip the waitlist.",
      personalMessage ? `\n${personalMessage}\n` : "",
      emailAppStorePlainText(),
      inviteCode
        ? `R/HOOD for DJs is an iOS app. Install from the App Store, sign up with this email, enter code ${inviteCode}, and start applying.`
        : "R/HOOD for DJs is an iOS app. Install from the App Store, sign up with this email, and start applying.",
    ]
      .filter(Boolean)
      .join("\n");

    const emailResponse = await resend.emails.send({
      from: defaultFromAddress,
      to: sanitizedEmail,
      subject: inviteCode
        ? `You're invited to R/HOOD — code ${inviteCode}`
        : `You're invited to R/HOOD - ${name}`,
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
      inviteCode: inviteCode || null,
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
