import { sanitizeEmail } from "./helpers";

/** Inbox that acts as the R/HOOD campaign agent on every brand–DJ thread. */
export const CAMPAIGN_AGENT_EMAIL = "hello@rhood.io";

export function campaignOpsEmail(): string {
  const explicit = process.env.CAMPAIGN_OPS_EMAIL?.trim();
  if (explicit) return sanitizeEmail(explicit);
  return CAMPAIGN_AGENT_EMAIL;
}

export function campaignAgentFromAddress(): string {
  return `R/HOOD <${campaignOpsEmail()}>`;
}

export function uniqueEmails(...values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    const email = sanitizeEmail(value);
    if (!email || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}
