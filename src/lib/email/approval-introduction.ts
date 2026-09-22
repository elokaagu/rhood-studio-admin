import { emailLimeButton, emailLogoBlock } from "./branding";
import { escapeHtml, firstNameFrom, sanitizeEmail } from "./helpers";

export type ApprovalIntroductionContent = {
  djName: string;
  djEmail: string;
  brandName: string;
  brandEmail: string;
  opportunityTitle: string;
  location?: string | null;
  eventDateLabel?: string | null;
};

export function replyAllMailto(input: ApprovalIntroductionContent): string {
  const subject = `Re: R/HOOD intro — ${input.djName} × ${input.brandName} for ${input.opportunityTitle}`;
  return `mailto:${input.djEmail},${input.brandEmail}?subject=${encodeURIComponent(subject)}`;
}

export function buildApprovalIntroduction(input: ApprovalIntroductionContent): {
  subject: string;
  html: string;
  text: string;
  to: string[];
  replyTo: string[];
  previewText: string;
} {
  const djEmail = sanitizeEmail(input.djEmail);
  const brandEmail = sanitizeEmail(input.brandEmail);
  const djName = input.djName.trim() || "the DJ";
  const brandName = input.brandName.trim() || "the brand";
  const title = input.opportunityTitle.trim() || "this opportunity";
  const djFirst = firstNameFrom(djName);
  const location = input.location?.trim() || "";
  const eventDateLabel = input.eventDateLabel?.trim() || "";
  const details = [location, eventDateLabel].filter(Boolean).join(" · ");

  const subject = `R/HOOD intro: ${djName} × ${brandName} for ${title}`;
  const previewText = `You're connected — reply all to plan ${title}.`;
  const mailto = replyAllMailto({
    ...input,
    djName,
    brandName,
    opportunityTitle: title,
    djEmail,
    brandEmail,
  });

  const safeDj = escapeHtml(djName);
  const safeBrand = escapeHtml(brandName);
  const safeTitle = escapeHtml(title);
  const safeDjFirst = escapeHtml(djFirst);
  const safeDjEmail = escapeHtml(djEmail);
  const safeBrandEmail = escapeHtml(brandEmail);
  const safeDetails = details ? escapeHtml(details) : "";

  const html = `
      <table style="width:100%;background-color:#0f0f0f;padding:32px 0;font-family:Helvetica,Arial,sans-serif;color:#ffffff;">
        <tr>
          <td align="center">
            <table style="width:560px;background-color:#1a1a1a;border-radius:16px;padding:40px;">
              ${emailLogoBlock("Introduction")}
              <tr>
                <td style="padding-top:24px;font-size:28px;font-weight:700;line-height:1.3;">You're connected</td>
              </tr>
              <tr>
                <td style="padding-top:16px;font-size:16px;line-height:1.6;color:#dddddd;">
                  Hey ${safeDjFirst} and ${safeBrand},<br/><br/>
                  <strong>${safeBrand}</strong> approved <strong>${safeDj}</strong> for <strong>${safeTitle}</strong>.
                  This email puts you both on the same thread so you can introduce yourselves and finish the opportunity from here.
                </td>
              </tr>
              ${
                safeDetails
                  ? `<tr>
                <td style="padding-top:16px;font-size:14px;line-height:1.6;color:#c2cc06;font-weight:700;">
                  ${safeDetails}
                </td>
              </tr>`
                  : ""
              }
              <tr>
                <td style="padding-top:24px;">
                  <table style="width:100%;background-color:#111111;border:1px solid #2a2a2a;border-radius:12px;padding:16px 18px;">
                    <tr>
                      <td style="font-size:14px;line-height:1.7;color:#dddddd;">
                        <span style="color:#9e9e9e;font-size:12px;letter-spacing:1px;text-transform:uppercase;">DJ</span><br/>
                        <strong>${safeDj}</strong><br/>
                        <a href="mailto:${safeDjEmail}" style="color:#c2cc06;text-decoration:none;">${safeDjEmail}</a>
                        <div style="height:14px;"></div>
                        <span style="color:#9e9e9e;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Brand</span><br/>
                        <strong>${safeBrand}</strong><br/>
                        <a href="mailto:${safeBrandEmail}" style="color:#c2cc06;text-decoration:none;">${safeBrandEmail}</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-top:32px;">
                  ${emailLimeButton(mailto, "Reply all to this thread")}
                </td>
              </tr>
              <tr>
                <td style="padding-top:28px;font-size:13px;line-height:1.6;color:#9e9e9e;">
                  Hit reply all so both of you stay on the chain — dates, logistics, and next steps. R/HOOD started this introduction; you can take it from here.
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

  const text = [
    `Hey ${djFirst} and ${brandName},`,
    "",
    `${brandName} approved ${djName} for "${title}".`,
    "You're both on this email so you can introduce yourselves and finish the opportunity from here.",
    details ? details : "",
    "",
    `DJ: ${djName} <${djEmail}>`,
    `Brand: ${brandName} <${brandEmail}>`,
    "",
    "Reply all to this thread to coordinate next steps.",
    "R/HOOD started this introduction; you can take it from here.",
  ]
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
    .join("\n");

  return {
    subject,
    html,
    text,
    to: [djEmail, brandEmail],
    replyTo: [djEmail, brandEmail],
    previewText,
  };
}
