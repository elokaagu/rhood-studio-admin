import { emailLogoBlock } from "@/lib/email/branding";
import { escapeHtml } from "@/lib/email/helpers";

export function buildPasswordResetEmail(input: { resetUrl: string; firstName?: string | null }) {
  const greeting = input.firstName?.trim() ? `Hey ${input.firstName.trim()},` : "Hey,";
  const safeGreeting = escapeHtml(greeting);
  const safeUrl = escapeHtml(input.resetUrl);

  const html = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000000;padding:32px 0;font-family:Helvetica,Arial,sans-serif;">
        <tr>
          <td align="center">
            <table role="presentation" style="width:560px;max-width:100%;background:#111111;border-radius:16px;padding:40px;color:#ffffff;">
              ${emailLogoBlock("Password reset")}
              <tr>
                <td style="padding-top:24px;font-size:28px;font-weight:700;line-height:1.3;">Reset your password</td>
              </tr>
              <tr>
                <td style="padding-top:16px;font-size:16px;line-height:1.6;color:#dddddd;">
                  ${safeGreeting}<br/><br/>
                  We got a request to reset the password for your R/HOOD Studio account. Tap the button below to choose a new one. The link works once and expires in an hour.
                </td>
              </tr>
              <tr>
                <td style="padding-top:28px;">
                  <a href="${safeUrl}" style="display:inline-block;background:#c2cc06;color:#000000;font-weight:700;font-size:16px;text-decoration:none;padding:14px 28px;border-radius:999px;">Choose a new password</a>
                </td>
              </tr>
              <tr>
                <td style="padding-top:28px;font-size:13px;line-height:1.6;color:#888888;">
                  If the button doesn't work, paste this link into your browser:<br/>
                  <a href="${safeUrl}" style="color:#c2cc06;word-break:break-all;">${safeUrl}</a>
                </td>
              </tr>
              <tr>
                <td style="padding-top:20px;font-size:13px;line-height:1.6;color:#888888;">
                  Didn't ask for this? You can ignore this email; your password won't change.
                </td>
              </tr>
            </table>
            <table role="presentation" style="width:560px;max-width:100%;padding:24px 0;color:#666666;font-size:12px;">
              <tr>
                <td align="center">© ${new Date().getFullYear()} R/HOOD. All rights reserved.</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
  `;

  const text = `${greeting}\n\nWe got a request to reset the password for your R/HOOD Studio account. Open this link to choose a new one (it works once and expires in an hour):\n\n${input.resetUrl}\n\nDidn't ask for this? Ignore this email; your password won't change.\n\n— R/HOOD`;

  return {
    subject: "Reset your R/HOOD Studio password",
    html,
    text,
  };
}
