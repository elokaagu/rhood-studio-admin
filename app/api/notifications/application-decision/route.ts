import { NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFromAddress =
  process.env.RESEND_FROM_EMAIL ?? "R/HOOD <hello@rhood.io>";

interface ApplicationDecisionPayload {
  email?: string;
  applicantName?: string | null;
  status?: string;
  opportunityTitle?: string;
}

// Email validation helper
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize email address
function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApplicationDecisionPayload;

    // Validate required fields
    if (!body.email || !body.status || !body.opportunityTitle) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: {
            email: !body.email ? "Email is required" : undefined,
            status: !body.status ? "Status is required" : undefined,
            opportunityTitle: !body.opportunityTitle
              ? "Opportunity title is required"
              : undefined,
          },
        },
        { status: 400 }
      );
    }

    // Validate email format
    const sanitizedEmail = sanitizeEmail(body.email);
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email address format" },
        { status: 400 }
      );
    }

    // Validate status
    if (body.status !== "approved" && body.status !== "rejected") {
      return NextResponse.json(
        { error: "Status must be either 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // Check Resend API key
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

    // Validate API key format (Resend keys start with 're_')
    if (!resendApiKey.startsWith("re_")) {
      console.warn(
        "[Resend] RESEND_API_KEY format appears invalid (should start with 're_')"
      );
    }

    // Initialize Resend client
    const resend = new Resend(resendApiKey);

    // Prepare email content
    const firstName = body.applicantName?.trim().split(" ")[0] || "there";
    const subject =
      body.status === "approved"
        ? `Congrats! You're booked for ${body.opportunityTitle}!`
        : `Update on ${body.opportunityTitle}`;
    const heroHeading =
      body.status === "approved"
        ? "You've been selected!"
        : "Thanks for applying";
    const bodyCopy =
      body.status === "approved"
        ? `Fantastic news – the team behind "${body.opportunityTitle}" would love to work with you. Log in to the Portal to review the details and confirm next steps.`
        : `Thanks for putting yourself forward for "${body.opportunityTitle}". The organiser went in a different direction this time, but we'd love to see you pitch again.`;

    const ctaLabel =
      body.status === "approved" ? "Open the Portal" : "Find more gigs";
    const previewText =
      body.status === "approved"
        ? "You've been booked – view the opportunity in the Portal"
        : "You're still on our radar – check other live gigs.";

    const portalUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://portal.rhood.co";

    const html = `
      <table style="width:100%;background-color:#0f0f0f;padding:32px 0;font-family:Helvetica,Arial,sans-serif;color:#ffffff;">
        <tr>
          <td align="center">
            <table style="width:560px;background-color:#1a1a1a;border-radius:16px;padding:40px;">
              <tr>
                <td style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#c2cc06;font-weight:700;">R/HOOD Portal</td>
              </tr>
              <tr>
                <td style="padding-top:24px;font-size:28px;font-weight:700;line-height:1.3;">${heroHeading}</td>
              </tr>
              <tr>
                <td style="padding-top:16px;font-size:16px;line-height:1.6;color:#dddddd;">
                  Hey ${firstName},<br/><br/>${bodyCopy}
                </td>
              </tr>
              <tr>
                <td style="padding-top:32px;">
                  <a href="${portalUrl}" style="display:inline-block;padding:14px 28px;background-color:#c2cc06;color:#1d1d1b;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;">${ctaLabel}</a>
                </td>
              </tr>
              <tr>
                <td style="padding-top:28px;font-size:13px;line-height:1.6;color:#9e9e9e;">
                  This notification was sent because your application for <strong>${
                    body.opportunityTitle
                  }</strong> was marked as ${body.status}.<br/>
                  Need help? Reply to this email or contact the R/HOOD team in the Portal.
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

    const text = `Hey ${firstName},\n\n${bodyCopy}\n\nSign in to the Portal for the latest updates: ${portalUrl}`;

    // Send email via Resend
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
          .substring(0, 50), // Limit header length
      },
    });

    // Check for Resend API errors
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

    // Log successful send
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
    // Handle different error types
    if (error instanceof Error) {
      console.error("[Resend] Error sending email:", {
        message: error.message,
        stack: error.stack,
      });

      // Check for specific error patterns
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
