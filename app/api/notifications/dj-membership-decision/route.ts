import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  emailLogoBlock,
  emailAppStoreButtons,
  emailAppStorePlainText,
} from "@/lib/email/branding";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFromAddress =
  process.env.RESEND_FROM_EMAIL ?? "R/HOOD <hello@rhood.io>";

interface Payload {
  email?: string;
  name?: string | null;
  status?: string;
}

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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Payload;
    const name = body.name?.trim() || "there";
    const status = body.status;

    if (!body.email || (status !== "approved" && status !== "rejected")) {
      return NextResponse.json(
        { error: "Email and a status of approved or rejected are required." },
        { status: 400 }
      );
    }

    const email = body.email.trim().toLowerCase();
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address format" }, { status: 400 });
    }

    if (!resendApiKey) {
      return NextResponse.json(
        {
          error: "Email service not configured",
          message: "RESEND_API_KEY environment variable is missing",
        },
        { status: 503 }
      );
    }

    const resend = new Resend(resendApiKey);
    const approved = status === "approved";
    const safeName = escapeHtml(name);
    const heading = approved
      ? "You're in. Welcome to R/HOOD."
      : "Update on your R/HOOD application";
    const bodyHtml = approved
      ? `${safeName}, your application to join R/HOOD as a DJ has been approved.<br/><br/>Open this email on your phone and download the app to start applying to opportunities.`
      : `${safeName}, thanks for applying to join R/HOOD. We are not able to approve your application this time. You can apply again later.`;

    const html = `
      <table style="width:100%;background-color:#0f0f0f;padding:32px 0;font-family:Helvetica,Arial,sans-serif;color:#ffffff;">
        <tr>
          <td align="center">
            <table style="width:560px;background-color:#1a1a1a;border-radius:16px;padding:40px;">
              ${emailLogoBlock("R/HOOD For DJs")}
              <tr>
                <td style="padding-top:24px;font-size:28px;font-weight:700;line-height:1.3;">${heading}</td>
              </tr>
              <tr>
                <td style="padding-top:16px;font-size:16px;line-height:1.6;color:#dddddd;">
                  ${bodyHtml}
                </td>
              </tr>
              ${
                approved
                  ? `<tr><td style="padding-top:32px;">${emailAppStoreButtons()}</td></tr>`
                  : ""
              }
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

    const text = approved
      ? [
          `You're in, ${name}. Your R/HOOD DJ application has been approved.`,
          "Open this email on your phone and download the app.",
          emailAppStorePlainText(),
        ].join("\n")
      : `${name}, thanks for applying to join R/HOOD. We are not able to approve your application this time.`;

    const emailResponse = await resend.emails.send({
      from: defaultFromAddress,
      to: email,
      subject: approved
        ? "You're in - welcome to R/HOOD"
        : "Update on your R/HOOD application",
      html,
      text,
    });

    if (emailResponse.error) {
      return NextResponse.json(
        {
          error: "Failed to send email",
          message: emailResponse.error.message || "Unknown Resend API error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, emailId: emailResponse.data?.id });
  } catch (error) {
    console.error("[Resend] DJ membership decision email failed:", error);
    return NextResponse.json(
      { error: "Failed to send membership email", message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
