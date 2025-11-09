import { NextResponse } from "next/server";
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFromAddress =
  process.env.RESEND_FROM_EMAIL ?? "R/HOOD Studio <studio@resend.dev>";

interface ApplicationDecisionPayload {
  email?: string;
  applicantName?: string | null;
  status?: string;
  opportunityTitle?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApplicationDecisionPayload;

    if (!body.email || !body.status || !body.opportunityTitle) {
      return NextResponse.json(
        { error: "Missing email, status or opportunity title" },
        { status: 400 }
      );
    }

    if (body.status !== "approved" && body.status !== "rejected") {
      return NextResponse.json(
        { error: "Status must be either approved or rejected" },
        { status: 400 }
      );
    }

    if (!resendApiKey) {
      console.warn(
        "RESEND_API_KEY is not configured. Skipping application decision email."
      );
      return NextResponse.json({ skipped: true }, { status: 200 });
    }

    const resend = new Resend(resendApiKey);
    const firstName = body.applicantName?.trim().split(" ")[0] || "there";
    const subject =
      body.status === "approved"
        ? `You're booked for ${body.opportunityTitle}!`
        : `Update on ${body.opportunityTitle}`;
    const heroHeading =
      body.status === "approved"
        ? "You've been selected!"
        : "Thanks for applying";
    const bodyCopy =
      body.status === "approved"
        ? `Fantastic news – the team behind "${body.opportunityTitle}" would love to work with you. Log in to the Studio to review the details and confirm next steps.`
        : `Thanks for putting yourself forward for "${body.opportunityTitle}". The organiser went in a different direction this time, but we’d love to see you pitch again.`;

    const ctaLabel =
      body.status === "approved" ? "Open the Studio" : "Find more gigs";
    const previewText =
      body.status === "approved"
        ? "You’ve been booked – view the opportunity in the Studio"
        : "You’re still on our radar – check other live gigs.";

    const html = `
      <table style="width:100%;background-color:#0f0f0f;padding:32px 0;font-family:Helvetica,Arial,sans-serif;color:#ffffff;">
        <tr>
          <td align="center">
            <table style="width:560px;background-color:#1a1a1a;border-radius:16px;padding:40px;">
              <tr>
                <td style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#c2cc06;font-weight:700;">R/HOOD Studio</td>
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
                  <a href="${
                    process.env.NEXT_PUBLIC_APP_URL ||
                    process.env.NEXT_PUBLIC_SITE_URL ||
                    "https://studio.rhood.co"
                  }" style="display:inline-block;padding:14px 28px;background-color:#c2cc06;color:#1d1d1b;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;">${ctaLabel}</a>
                </td>
              </tr>
              <tr>
                <td style="padding-top:28px;font-size:13px;line-height:1.6;color:#9e9e9e;">
                  This notification was sent because your application for <strong>${
                    body.opportunityTitle
                  }</strong> was marked as ${body.status}.<br/>
                  Need help? Reply to this email or contact the R/HOOD team in the Studio.
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

    const text = `Hey ${firstName},\n\n${bodyCopy}\n\nSign in to the Studio for the latest updates.`;

    await resend.emails.send({
      from: defaultFromAddress,
      to: body.email,
      subject,
      html,
      text,
      headers: {
        "X-Entity-Ref-ID": `${body.status}-${body.opportunityTitle}`
          .replace(/\s+/g, "-")
          .toLowerCase(),
      },
    });

    return NextResponse.json({ success: true, previewText });
  } catch (error) {
    console.error("Failed to send application decision email:", error);
    return NextResponse.json(
      { error: "Failed to send application decision email" },
      { status: 500 }
    );
  }
}
