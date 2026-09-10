import { NextResponse } from "next/server";
import { Resend } from "resend";
import { emailLogoBlock, emailAppStoreButtons, emailAppStorePlainText } from "@/lib/email/branding";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFromAddress = "R/HOOD <hello@rhood.io>";

interface BookingRequestPayload {
  djEmail?: string;
  djName?: string;
  brandName?: string;
  eventTitle?: string;
  eventDate?: string;
  eventEndTime?: string;
  location?: string;
  paymentAmount?: number | null;
  paymentCurrency?: string;
  bookingRequestId?: string;
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

// Format date for display
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

// Format time for display
function formatTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BookingRequestPayload;

    // Validate required fields
    if (!body.djEmail || !body.brandName || !body.eventTitle || !body.eventDate) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: {
            djEmail: !body.djEmail ? "DJ email is required" : undefined,
            brandName: !body.brandName ? "Brand name is required" : undefined,
            eventTitle: !body.eventTitle ? "Event title is required" : undefined,
            eventDate: !body.eventDate ? "Event date is required" : undefined,
          },
        },
        { status: 400 }
      );
    }

    // Validate email format
    const sanitizedEmail = sanitizeEmail(body.djEmail);
    if (!isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email address format" },
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

    // Initialize Resend client
    const resend = new Resend(resendApiKey);

    // Prepare email content
    const firstName = body.djName?.trim().split(" ")[0] || "there";
    const eventDateFormatted = formatDate(body.eventDate);
    const eventTimeFormatted = body.eventDate
      ? formatTime(body.eventDate)
      : "";
    const eventEndTimeFormatted = body.eventEndTime
      ? formatTime(body.eventEndTime)
      : "";

    const paymentInfo = body.paymentAmount
      ? `${body.paymentCurrency === "GBP" ? "£" : body.paymentCurrency === "USD" ? "$" : "€"}${body.paymentAmount.toLocaleString()}`
      : "To be discussed";

    const html = `
      <table style="width:100%;background-color:#0f0f0f;padding:32px 0;font-family:Helvetica,Arial,sans-serif;color:#ffffff;">
        <tr>
          <td align="center">
            <table style="width:560px;background-color:#1a1a1a;border-radius:16px;padding:40px;">
              ${emailLogoBlock("R/HOOD")}
              <tr>
                <td style="padding-top:24px;font-size:28px;font-weight:700;line-height:1.3;">New Booking Request</td>
              </tr>
              <tr>
                <td style="padding-top:16px;font-size:16px;line-height:1.6;color:#dddddd;">
                  Hey ${firstName},<br/><br/>
                  <strong>${body.brandName}</strong> wants to book you for their event!
                </td>
              </tr>
              <tr>
                <td style="padding-top:24px;background-color:#252525;border-radius:8px;padding:20px;">
                  <table style="width:100%;">
                    <tr>
                      <td style="padding-bottom:12px;font-size:14px;color:#9e9e9e;">Event</td>
                      <td style="padding-bottom:12px;font-size:14px;font-weight:600;color:#ffffff;text-align:right;">${body.eventTitle}</td>
                    </tr>
                    <tr>
                      <td style="padding-bottom:12px;font-size:14px;color:#9e9e9e;">Date</td>
                      <td style="padding-bottom:12px;font-size:14px;font-weight:600;color:#ffffff;text-align:right;">${eventDateFormatted}</td>
                    </tr>
                    ${eventTimeFormatted ? `
                    <tr>
                      <td style="padding-bottom:12px;font-size:14px;color:#9e9e9e;">Time</td>
                      <td style="padding-bottom:12px;font-size:14px;font-weight:600;color:#ffffff;text-align:right;">${eventTimeFormatted}${eventEndTimeFormatted ? ` - ${eventEndTimeFormatted}` : ""}</td>
                    </tr>
                    ` : ""}
                    ${body.location ? `
                    <tr>
                      <td style="padding-bottom:12px;font-size:14px;color:#9e9e9e;">Location</td>
                      <td style="padding-bottom:12px;font-size:14px;font-weight:600;color:#ffffff;text-align:right;">${body.location}</td>
                    </tr>
                    ` : ""}
                    <tr>
                      <td style="font-size:14px;color:#9e9e9e;">Payment</td>
                      <td style="font-size:14px;font-weight:600;color:#ffffff;text-align:right;">${paymentInfo}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-top:32px;">
                  ${emailAppStoreButtons()}
                </td>
              </tr>
              <tr>
                <td style="padding-top:28px;font-size:13px;line-height:1.6;color:#9e9e9e;">
                  Open the R/HOOD app on your phone to view and respond to this booking request.<br/>
                  If you do not have the app yet, download it from the App Store or Google Play, then sign in with this email.
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

    const text = `Hey ${firstName},\n\n${body.brandName} wants to book you for their event: "${body.eventTitle}"\n\nDate: ${eventDateFormatted}\n${eventTimeFormatted ? `Time: ${eventTimeFormatted}${eventEndTimeFormatted ? ` - ${eventEndTimeFormatted}` : ""}\n` : ""}${body.location ? `Location: ${body.location}\n` : ""}Payment: ${paymentInfo}\n\nOpen the R/HOOD app on your phone to view this booking request.\n${emailAppStorePlainText()}`;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: defaultFromAddress,
      to: sanitizedEmail,
      subject: `Booking Request: ${body.eventTitle}`,
      html,
      text,
      headers: {
        "X-Entity-Ref-ID": `booking-${body.bookingRequestId || "request"}`
          .replace(/\s+/g, "-")
          .toLowerCase()
          .substring(0, 50),
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
      `[Resend] Booking request email sent successfully to ${sanitizedEmail}`
    );

    return NextResponse.json({
      success: true,
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
              "Verify your domain or use a verified email address",
          },
          { status: 400 }
        );
      }
    }

    console.error("[Resend] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Failed to send booking request email",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

