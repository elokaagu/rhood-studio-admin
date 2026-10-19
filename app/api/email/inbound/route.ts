import { NextResponse } from "next/server";
import { Resend } from "resend";
import { recordCampaignMessage } from "@/lib/campaigns/store-message";
import { sanitizeEmail } from "@/lib/email/helpers";
import {
  isTrackedEmailEvent,
  recordEmailEvent,
  resolveWebhookSecret,
  serviceClient,
} from "@/lib/email/marketing/server";

function addresses(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") return [sanitizeEmail(value)].filter(Boolean);
  if (Array.isArray(value)) {
    return value.flatMap((item) => addresses(item)).filter(Boolean);
  }
  if (typeof value === "object" && value) {
    const row = value as {
      address?: string;
      email?: string;
      from?: unknown;
    };
    if (row.address) return [sanitizeEmail(row.address)].filter(Boolean);
    if (row.email) return [sanitizeEmail(row.email)].filter(Boolean);
    if (row.from) return addresses(row.from);
  }
  return [];
}

function textBody(data: Record<string, unknown>): string | null {
  if (typeof data.text === "string" && data.text.trim()) return data.text;
  if (typeof data.body === "string" && data.body.trim()) return data.body;
  if (typeof data.plain === "string" && data.plain.trim()) return data.plain;
  if (typeof data.html === "string" && data.html.trim()) {
    return data.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  return null;
}

function inboundPayload(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  const payload = raw as {
    type?: string;
    data?: Record<string, unknown>;
    email?: Record<string, unknown>;
  };
  const nested =
    (payload.data && typeof payload.data === "object" ? payload.data : null) ||
    (payload.email && typeof payload.email === "object" ? payload.email : null);
  if (nested && typeof nested.email === "object" && nested.email) {
    return { ...nested, ...(nested.email as Record<string, unknown>) };
  }
  return nested || (raw as Record<string, unknown>);
}

async function fetchReceivingBody(emailId: string): Promise<{
  text: string | null;
  from: string | null;
  to: string[];
  cc: string[];
  subject: string | null;
}> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { text: null, from: null, to: [], cc: [], subject: null };
  }
  const response = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: { Authorization: `Bearer ${key}` },
  }).catch(() => null);
  if (!response?.ok) {
    return { text: null, from: null, to: [], cc: [], subject: null };
  }
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const data = body?.data && typeof body.data === "object"
    ? (body.data as Record<string, unknown>)
    : body || {};
  return {
    text: textBody(data),
    from: addresses(data.from)[0] || null,
    to: addresses(data.to),
    cc: addresses(data.cc),
    subject: typeof data.subject === "string" ? data.subject : null,
  };
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Accepts only Resend webhooks with a valid Svix signature (RESEND_WEBHOOK_SECRET,
 * or the signing secret saved by the Studio email setup), or callers presenting
 * CAMPAIGN_INBOUND_SECRET. Anything else is rejected, including when no secret is configured.
 */
function isAuthorized(request: Request, rawBody: string, webhookSecret: string | null): boolean {
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (svixId && svixTimestamp && svixSignature) {
    if (!webhookSecret) return false;
    try {
      new Resend(process.env.RESEND_API_KEY || "re_verify_only").webhooks.verify({
        payload: rawBody,
        headers: { id: svixId, timestamp: svixTimestamp, signature: svixSignature },
        webhookSecret,
      });
      return true;
    } catch {
      return false;
    }
  }

  const sharedSecret = process.env.CAMPAIGN_INBOUND_SECRET;
  if (!sharedSecret) return false;
  const presented =
    request.headers.get("x-campaign-secret") ||
    (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  return Boolean(presented) && timingSafeEqual(presented, sharedSecret);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const admin = serviceClient();
  const webhookSecret = await resolveWebhookSecret(admin);
  if (!isAuthorized(request, rawBody, webhookSecret)) {
    console.warn("[email/inbound] rejected unauthenticated request", {
      hasSvixHeaders: Boolean(request.headers.get("svix-signature")),
      webhookSecretSet: Boolean(webhookSecret),
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!admin) {
    return NextResponse.json({ error: "Missing Supabase service role." }, { status: 500 });
  }

  let raw: unknown = null;
  try {
    raw = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const eventType = (raw as { type?: unknown } | null)?.type;
  if (isTrackedEmailEvent(eventType)) {
    await recordEmailEvent(admin, request.headers.get("svix-id"), raw);
    return NextResponse.json({ ok: true });
  }
  if (typeof eventType === "string" && eventType !== "email.received") {
    return NextResponse.json({ ok: true, ignored: eventType });
  }
  const data = inboundPayload(raw);
  let from = addresses(data.from)[0] || null;
  let to = addresses(data.to);
  let cc = addresses(data.cc);
  let subject = typeof data.subject === "string" ? data.subject : null;
  let text = textBody(data);
  const resendId =
    (typeof data.email_id === "string" && data.email_id) ||
    (typeof data.id === "string" && data.id) ||
    null;

  if (resendId && (!text || !from)) {
    const extra = await fetchReceivingBody(resendId);
    text = text || extra.text;
    from = from || extra.from;
    if (to.length === 0) to = extra.to;
    if (cc.length === 0) cc = extra.cc;
    subject = subject || extra.subject;
  }

  await recordCampaignMessage(admin, {
    subject,
    fromEmail: from,
    toEmails: to,
    ccEmails: cc,
    bodyText: text,
    direction: "inbound",
    resendId,
  });

  return NextResponse.json({ ok: true });
}
