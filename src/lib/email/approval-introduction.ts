import { emailLimeButton, emailLogoBlock } from "./branding";
import { escapeHtml, firstNameFrom, sanitizeEmail } from "./helpers";
import { campaignOpsEmail, uniqueEmails } from "./ops";

export type ApprovalIntroductionContent = {
  djName: string;
  djEmail: string;
  brandName: string;
  brandEmail: string;
  opportunityTitle: string;
  location?: string | null;
  eventDateLabel?: string | null;
  additionalInfo?: string | null;
  compensation?: string | null;
};

export function replyAllMailto(input: ApprovalIntroductionContent): string {
  const ops = campaignOpsEmail();
  const subject = `Re: R/HOOD intro — ${input.djName} × ${input.brandName} for ${input.opportunityTitle}`;
  const addresses = uniqueEmails(input.djEmail, input.brandEmail, ops).join(",");
  return `mailto:${addresses}?subject=${encodeURIComponent(subject)}`;
}

export function buildApprovalIntroduction(input: ApprovalIntroductionContent): {
  subject: string;
  html: string;
  text: string;
  to: string[];
  cc: string[];
  replyTo: string[];
  previewText: string;
} {
  const djEmail = sanitizeEmail(input.djEmail);
  const brandEmail = sanitizeEmail(input.brandEmail);
  const opsEmail = campaignOpsEmail();
  const cc = uniqueEmails(opsEmail).filter(
    (email) => email !== djEmail && email !== brandEmail
  );
  const replyTo = uniqueEmails(djEmail, brandEmail, opsEmail);
  const djName = input.djName.trim() || "the DJ";
  const brandName = input.brandName.trim() || "the brand";
  const title = input.opportunityTitle.trim() || "this opportunity";
  const djFirst = firstNameFrom(djName);
  const location = input.location?.trim() || "";
  const eventDateLabel = input.eventDateLabel?.trim() || "";
  const additionalInfo = input.additionalInfo?.trim() || "";
  const compensation = input.compensation?.trim() || "";
  const details = [location, eventDateLabel].filter(Boolean).join(" · ");

  const subject = `R/HOOD intro: ${djName} × ${brandName} for ${title}`;
  const previewText = `All campaign communication stays on this thread with ${opsEmail}.`;
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
  const safeOps = escapeHtml(opsEmail);
  const safeDetails = details ? escapeHtml(details) : "";
  const safeAdditional = additionalInfo
    ? escapeHtml(additionalInfo).replace(/\n/g, "<br/>")
    : "";
  const safeCompensation = compensation ? escapeHtml(compensation) : "";
  const factsRows = [
    safeDetails
      ? `<tr><td style="padding:6px 0;color:#9e9e9e;width:110px;vertical-align:top;">When / where</td><td style="padding:6px 0;color:#dddddd;">${safeDetails}</td></tr>`
      : "",
    safeCompensation
      ? `<tr><td style="padding:6px 0;color:#9e9e9e;width:110px;vertical-align:top;">Fee</td><td style="padding:6px 0;color:#dddddd;">${safeCompensation}</td></tr>`
      : "",
    safeAdditional
      ? `<tr><td style="padding:6px 0;color:#9e9e9e;width:110px;vertical-align:top;">Notes</td><td style="padding:6px 0;color:#dddddd;">${safeAdditional}</td></tr>`
      : "",
  ]
    .filter(Boolean)
    .join("");

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
                  This email is the campaign thread.
                </td>
              </tr>
              <tr>
                <td style="padding-top:20px;">
                  <table style="width:100%;background-color:#111111;border:1px solid #c2cc06;border-radius:12px;padding:16px 18px;">
                    <tr>
                      <td style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#c2cc06;font-weight:700;padding-bottom:8px;">
                        All communication stays here
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:14px;line-height:1.7;color:#dddddd;">
                        Everything about this campaign happens in this email thread — dates, brief, logistics, questions, and anything else.
                        Don't move it to WhatsApp, DMs, or a separate email.<br/><br/>
                        <a href="mailto:${safeOps}" style="color:#c2cc06;text-decoration:none;">${safeOps}</a>
                        is on this thread as R/HOOD. That's how we follow the work and manage this campaign in the R/HOOD portal.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              ${
                factsRows
                  ? `<tr>
                <td style="padding-top:20px;">
                  <table style="width:100%;background-color:#111111;border:1px solid #2a2a2a;border-radius:12px;padding:16px 18px;">
                    <tr>
                      <td style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#9e9e9e;font-weight:700;padding-bottom:8px;">
                        Opportunity
                      </td>
                    </tr>
                    ${factsRows}
                  </table>
                </td>
              </tr>`
                  : ""
              }
              <tr>
                <td style="padding-top:20px;">
                  <table style="width:100%;background-color:#111111;border:1px solid #2a2a2a;border-radius:12px;padding:16px 18px;">
                    <tr>
                      <td style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#c2cc06;font-weight:700;padding-bottom:10px;">
                        How this will be executed
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:14px;line-height:1.7;color:#dddddd;">
                        1. Stay on this thread for everything related to this campaign.<br/>
                        2. Reply all so the DJ, the brand, and ${safeOps} stay on every message.<br/>
                        3. Lock date, time, location, and what “done” looks like.<br/>
                        4. Brand shares the brief and any assets the DJ needs.<br/>
                        5. DJ confirms they can deliver and flags gaps.<br/>
                        6. R/HOOD invoices the brand and pays the DJ once the work is confirmed.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-top:12px;">
                  <table style="width:100%;background-color:#111111;border:1px solid #2a2a2a;border-radius:12px;padding:16px 18px;">
                    <tr>
                      <td style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#9e9e9e;font-weight:700;padding-bottom:8px;">
                        Brand — ${safeBrand}
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:14px;line-height:1.7;color:#dddddd;">
                        Confirm date, venue, and load-in.<br/>
                        Send the brief and what you need delivered.<br/>
                        Reply all on this thread so ${safeDj} and ${safeOps} see it.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-top:12px;">
                  <table style="width:100%;background-color:#111111;border:1px solid #2a2a2a;border-radius:12px;padding:16px 18px;">
                    <tr>
                      <td style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#9e9e9e;font-weight:700;padding-bottom:8px;">
                        DJ — ${safeDj}
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:14px;line-height:1.7;color:#dddddd;">
                        Confirm you can do the date and the brief.<br/>
                        List tech needs or missing info.<br/>
                        Reply all on this thread — don't drop ${safeOps} off the chain.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-top:12px;">
                  <table style="width:100%;background-color:#111111;border:1px solid #2a2a2a;border-radius:12px;padding:16px 18px;">
                    <tr>
                      <td style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#9e9e9e;font-weight:700;padding-bottom:8px;">
                        R/HOOD — ${safeOps}
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:14px;line-height:1.7;color:#dddddd;">
                        Stays copied on every reply.<br/>
                        Follows the thread so the campaign can be managed in the R/HOOD portal.<br/>
                        Handles invoicing the brand and paying the DJ.
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
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
                        <div style="height:14px;"></div>
                        <span style="color:#9e9e9e;font-size:12px;letter-spacing:1px;text-transform:uppercase;">R/HOOD</span><br/>
                        <strong>hello@rhood.io</strong><br/>
                        <a href="mailto:${safeOps}" style="color:#c2cc06;text-decoration:none;">${safeOps}</a>
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
                  Keep every message on this thread with ${safeOps}. That's how R/HOOD manages the campaign in the portal.
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
    `${brandName} approved ${djName} for "${title}". This email is the campaign thread.`,
    "",
    "All communication about this campaign stays in this email thread — dates, brief, logistics, questions, and anything else. Don't move it to WhatsApp, DMs, or a separate email.",
    `${opsEmail} is on this thread as R/HOOD. That's how we follow the work and manage this campaign in the R/HOOD portal.`,
    details ? details : "",
    additionalInfo ? `Notes:\n${additionalInfo}` : "",
    compensation ? `Fee: ${compensation}` : "",
    "",
    "How this will be executed:",
    "1. Stay on this thread for everything related to this campaign.",
    `2. Reply all so the DJ, the brand, and ${opsEmail} stay on every message.`,
    "3. Lock date, time, location, and what done looks like.",
    "4. Brand shares the brief and any assets the DJ needs.",
    "5. DJ confirms they can deliver and flags gaps.",
    "6. R/HOOD invoices the brand and pays the DJ once the work is confirmed.",
    "",
    `Brand (${brandName}): confirm date/venue/load-in, send the brief, reply all on this thread.`,
    `DJ (${djName}): confirm the date and brief, list tech needs, reply all on this thread.`,
    `R/HOOD (${opsEmail}): stays copied, manages the campaign in the portal, invoices the brand and pays the DJ.`,
    "",
    `DJ: ${djName} <${djEmail}>`,
    `Brand: ${brandName} <${brandEmail}>`,
    `R/HOOD: ${opsEmail}`,
    "",
    `Keep every message on this thread with ${opsEmail}. That's how R/HOOD manages the campaign in the portal.`,
  ]
    .filter((line, index, lines) => !(line === "" && lines[index - 1] === ""))
    .join("\n");

  return {
    subject,
    html,
    text,
    to: [djEmail, brandEmail],
    cc,
    replyTo,
    previewText,
  };
}
