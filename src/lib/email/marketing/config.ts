import { PORTAL_BASE_URL } from "@/lib/portal-url";

/** Marketing mail goes out from its own subdomain so blasts can't hurt hello@rhood.io. */
export const MARKETING_DOMAIN = "news.rhood.io";
export const MARKETING_TRACKING_SUBDOMAIN = "links";
export const MARKETING_FROM = `R/HOOD <hello@${MARKETING_DOMAIN}>`;
export const MARKETING_REPLY_TO = "hello@rhood.io";

export const RESEND_WEBHOOK_ENDPOINT = `${PORTAL_BASE_URL}/api/email/inbound`;

export type SegmentKey = "everyone" | "djs" | "brands" | "team" | "mailing_list";

export const MARKETING_SEGMENTS: Record<SegmentKey, string> = {
  everyone: "Everyone on R/HOOD",
  djs: "DJs",
  brands: "Brands",
  team: "R/HOOD team",
  mailing_list: "Mailing list",
};

export const MARKETING_TOPIC = {
  name: "R/HOOD updates",
  description: "Launches, new features and news from R/HOOD.",
};

/** Custom contact fields, usable in broadcasts as {{{contact.<key>|fallback}}}. */
export const CONTACT_PROPERTIES = [
  { key: "display_name", fallback: "there" },
  { key: "role", fallback: "" },
  { key: "status", fallback: "" },
  { key: "city", fallback: "" },
  { key: "brand_name", fallback: "" },
  { key: "joined_on", fallback: "" },
  { key: "user_id", fallback: "" },
] as const;

/** Webhook events stored for analytics. email.received keeps intro-thread replies flowing. */
export const TRACKED_EMAIL_EVENTS = [
  "email.sent",
  "email.delivered",
  "email.delivery_delayed",
  "email.opened",
  "email.clicked",
  "email.bounced",
  "email.complained",
  "email.failed",
  "email.suppressed",
] as const;

export const WEBHOOK_EVENTS = [...TRACKED_EMAIL_EVENTS, "email.received"] as const;
