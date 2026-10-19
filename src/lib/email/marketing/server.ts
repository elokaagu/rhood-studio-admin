import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend, type WebhookEvent } from "resend";
import {
  CONTACT_PROPERTIES,
  MARKETING_DOMAIN,
  MARKETING_SEGMENTS,
  MARKETING_TOPIC,
  MARKETING_TRACKING_SUBDOMAIN,
  RESEND_WEBHOOK_ENDPOINT,
  TRACKED_EMAIL_EVENTS,
  WEBHOOK_EVENTS,
  type SegmentKey,
} from "@/lib/email/marketing/config";
import type {
  BroadcastSummary,
  DomainSetting,
  EventCounts,
  MarketingStatus,
} from "@/lib/email/marketing/types";

type Admin = SupabaseClient;

export function serviceClient(): Admin | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export function resendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
// Resend allows 10 requests/second per team; stay well under it.
const RESEND_GAP_MS = 150;

function unwrap<T>(
  result: { data: T | null; error: { message: string } | null },
  label: string
): T {
  if (result.error || result.data === null) {
    throw new Error(`${label}: ${result.error?.message || "no data returned"}`);
  }
  return result.data;
}

export async function getSetting<T>(admin: Admin, key: string): Promise<T | null> {
  const { data } = await admin.from("email_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value as T | undefined) ?? null;
}

async function putSetting(admin: Admin, key: string, value: unknown) {
  const { error } = await admin
    .from("email_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Saving ${key}: ${error.message}`);
}

/** Bearer-token admin check shared by the email admin routes. */
export async function requireAdmin(
  request: Request
): Promise<{ admin: Admin } | { response: NextResponse }> {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const admin = serviceClient();
  if (!admin) {
    return { response: NextResponse.json({ error: "Supabase is not configured." }, { status: 500 }) };
  }
  if (!token) {
    return { response: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };
  }
  const {
    data: { user },
  } = await admin.auth.getUser(token);
  if (!user) {
    return { response: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };
  }
  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return { response: NextResponse.json({ error: "R/HOOD team only." }, { status: 403 }) };
  }
  return { admin };
}

type SegmentIds = Record<SegmentKey, string>;

async function ensureDomain(resend: Resend): Promise<DomainSetting> {
  const domains = unwrap(await resend.domains.list(), "Listing domains").data;
  const domain = domains.find((d) => d.name === MARKETING_DOMAIN);

  if (!domain) {
    const root = domains.find((d) => d.name === "rhood.io");
    const created = unwrap(
      await resend.domains.create({
        name: MARKETING_DOMAIN,
        region: root?.region,
        openTracking: true,
        clickTracking: true,
        trackingSubdomain: MARKETING_TRACKING_SUBDOMAIN,
      }),
      "Creating news.rhood.io"
    );
    await pause(RESEND_GAP_MS);
    return readDomain(resend, created.id);
  }

  if (!domain.open_tracking || !domain.click_tracking || !domain.tracking_subdomain) {
    unwrap(
      await resend.domains.update({
        id: domain.id,
        openTracking: true,
        clickTracking: true,
        trackingSubdomain: domain.tracking_subdomain || MARKETING_TRACKING_SUBDOMAIN,
      }),
      "Turning on tracking"
    );
    await pause(RESEND_GAP_MS);
  }
  if (domain.status !== "verified") {
    // Ask Resend to re-check DNS; harmless if records aren't there yet.
    await resend.domains.verify(domain.id);
    await pause(RESEND_GAP_MS);
  }
  return readDomain(resend, domain.id);
}

async function readDomain(resend: Resend, id: string): Promise<DomainSetting> {
  const domain = unwrap(await resend.domains.get(id), "Reading news.rhood.io");
  return {
    id: domain.id,
    name: domain.name,
    status: domain.status,
    openTracking: Boolean(domain.open_tracking),
    clickTracking: Boolean(domain.click_tracking),
    trackingSubdomain: domain.tracking_subdomain ?? null,
    records: domain.records.map((r) => ({
      record: r.record,
      type: r.type,
      name: r.name,
      value: r.value,
      priority: "priority" in r ? r.priority : undefined,
      status: r.status,
    })),
    checkedAt: new Date().toISOString(),
  };
}

async function ensureProperties(resend: Resend) {
  const existing = unwrap(await resend.contactProperties.list(), "Listing contact fields").data;
  const keys = new Set(existing.map((p) => p.key));
  for (const prop of CONTACT_PROPERTIES) {
    if (keys.has(prop.key)) continue;
    await pause(RESEND_GAP_MS);
    unwrap(
      await resend.contactProperties.create({
        key: prop.key,
        type: "string",
        fallbackValue: prop.fallback || null,
      }),
      `Creating contact field ${prop.key}`
    );
  }
}

async function ensureSegments(resend: Resend): Promise<SegmentIds> {
  const existing = unwrap(await resend.segments.list({ limit: 100 }), "Listing segments").data;
  const ids = {} as SegmentIds;
  for (const [key, name] of Object.entries(MARKETING_SEGMENTS) as [SegmentKey, string][]) {
    const found = existing.find((s) => s.name === name);
    if (found) {
      ids[key] = found.id;
      continue;
    }
    await pause(RESEND_GAP_MS);
    ids[key] = unwrap(await resend.segments.create({ name }), `Creating segment ${name}`).id;
  }
  return ids;
}

async function ensureTopic(resend: Resend): Promise<string> {
  const topics = unwrap(await resend.topics.list(), "Listing topics").data;
  const found = topics.find((t) => t.name === MARKETING_TOPIC.name);
  if (found) return found.id;
  await pause(RESEND_GAP_MS);
  return unwrap(
    await resend.topics.create({
      name: MARKETING_TOPIC.name,
      description: MARKETING_TOPIC.description,
      defaultSubscription: "opt_in",
    }),
    "Creating topic"
  ).id;
}

async function ensureWebhook(resend: Resend, admin: Admin) {
  const hooks = unwrap(await resend.webhooks.list(), "Listing webhooks").data;
  const existing = hooks.find((h) => h.endpoint === RESEND_WEBHOOK_ENDPOINT);
  const wanted = WEBHOOK_EVENTS as readonly WebhookEvent[];

  let id: string;
  if (existing) {
    id = existing.id;
    const events = Array.from(new Set([...(existing.events ?? []), ...wanted]));
    await pause(RESEND_GAP_MS);
    unwrap(
      await resend.webhooks.update(id, { events, status: "enabled" }),
      "Updating webhook events"
    );
  } else {
    await pause(RESEND_GAP_MS);
    id = unwrap(
      await resend.webhooks.create({ endpoint: RESEND_WEBHOOK_ENDPOINT, events: [...wanted] }),
      "Creating webhook"
    ).id;
  }

  await pause(RESEND_GAP_MS);
  const hook = unwrap(await resend.webhooks.get(id), "Reading webhook");
  await putSetting(admin, "webhook", { id, endpoint: hook.endpoint, events: hook.events });
  await putSetting(admin, "webhook_signing_secret", hook.signing_secret);
}

export type SetupResult = { ok: true } | { ok: false; message: string };

/** Creates or repairs everything in Resend. Safe to run repeatedly. */
export async function ensureMarketingSetup(admin: Admin): Promise<SetupResult> {
  const resend = resendClient();
  if (!resend) return { ok: false, message: "RESEND_API_KEY is not set on this deployment." };
  try {
    const domain = await ensureDomain(resend);
    await putSetting(admin, "domain", domain);
    await pause(RESEND_GAP_MS);
    await ensureProperties(resend);
    await pause(RESEND_GAP_MS);
    await putSetting(admin, "segments", await ensureSegments(resend));
    await pause(RESEND_GAP_MS);
    await putSetting(admin, "topic_id", await ensureTopic(resend));
    await pause(RESEND_GAP_MS);
    await ensureWebhook(resend, admin);
    await putSetting(admin, "setup_at", new Date().toISOString());
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Setup failed." };
  }
}

export async function refreshDomain(admin: Admin): Promise<SetupResult> {
  const resend = resendClient();
  if (!resend) return { ok: false, message: "RESEND_API_KEY is not set on this deployment." };
  const saved = await getSetting<DomainSetting>(admin, "domain");
  if (!saved) return { ok: false, message: "Run setup first." };
  try {
    if (saved.status !== "verified") {
      await resend.domains.verify(saved.id);
      await pause(1500);
    }
    await putSetting(admin, "domain", await readDomain(resend, saved.id));
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Check failed." };
  }
}

type ProfileRow = {
  id: string;
  email: string | null;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  dj_name: string | null;
  brand_name: string | null;
  city: string | null;
  membership_status: string | null;
  is_verified: boolean | null;
  created_at: string | null;
};

type SyncRow = {
  user_id: string;
  email: string;
  segment_ids: string[];
  fingerprint: string | null;
};

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function contactFor(profile: ProfileRow, segments: SegmentIds) {
  const role = profile.role || "";
  const approvedDj =
    role === "dj" && (profile.membership_status === "approved" || profile.is_verified === true);
  const segmentIds = [segments.everyone];
  if (approvedDj) segmentIds.push(segments.djs);
  if (role === "brand") segmentIds.push(segments.brands);
  if (role === "admin") segmentIds.push(segments.team);

  const displayName =
    (role === "dj" ? clean(profile.dj_name) : null) ||
    clean(profile.first_name) ||
    clean(profile.brand_name) ||
    null;

  const properties = {
    display_name: displayName,
    role: role || null,
    status: clean(profile.membership_status) || (profile.is_verified ? "approved" : null),
    city: clean(profile.city),
    brand_name: role === "brand" ? clean(profile.brand_name) : null,
    joined_on: profile.created_at ? profile.created_at.slice(0, 10) : null,
    user_id: profile.id,
  };

  return {
    email: profile.email!.trim().toLowerCase(),
    firstName: clean(profile.first_name),
    lastName: clean(profile.last_name),
    properties,
    segmentIds,
  };
}

export type SyncResult =
  | { ok: true; created: number; updated: number; unchanged: number; failed: number }
  | { ok: false; message: string };

/** Pushes Studio users into Resend contacts. Only changed users are sent unless `full`. */
export async function syncContacts(admin: Admin, opts: { full?: boolean } = {}): Promise<SyncResult> {
  const resend = resendClient();
  if (!resend) return { ok: false, message: "RESEND_API_KEY is not set on this deployment." };
  const segments = await getSetting<SegmentIds>(admin, "segments");
  if (!segments) return { ok: false, message: "Run setup first." };

  const { data: profiles, error } = await admin
    .from("user_profiles")
    .select(
      "id, email, role, first_name, last_name, dj_name, brand_name, city, membership_status, is_verified, created_at"
    )
    .not("email", "is", null);
  if (error) return { ok: false, message: error.message };

  const { data: syncedRows } = await admin
    .from("email_contact_sync")
    .select("user_id, email, segment_ids, fingerprint");
  const synced = new Map(((syncedRows || []) as SyncRow[]).map((row) => [row.user_id, row]));
  const managed = new Set(
    [segments.everyone, segments.djs, segments.brands, segments.team].filter(Boolean)
  );

  const counts = { created: 0, updated: 0, unchanged: 0, failed: 0 };

  for (const profile of (profiles || []) as ProfileRow[]) {
    if (!profile.email?.includes("@")) continue;
    const contact = contactFor(profile, segments);
    const fingerprint = JSON.stringify(contact);
    const previous = synced.get(profile.id);
    if (!opts.full && previous?.fingerprint === fingerprint) {
      counts.unchanged += 1;
      continue;
    }

    try {
      await pause(RESEND_GAP_MS);
      const existing = await resend.contacts.get({ email: contact.email });
      let contactId: string;

      if (existing.data) {
        contactId = existing.data.id;
        await pause(RESEND_GAP_MS);
        unwrap(
          await resend.contacts.update({
            email: contact.email,
            firstName: contact.firstName,
            lastName: contact.lastName,
            properties: contact.properties,
          }),
          "Updating contact"
        );
        const had = new Set(previous?.segment_ids ?? []);
        for (const segmentId of contact.segmentIds) {
          if (had.has(segmentId)) continue;
          await pause(RESEND_GAP_MS);
          await resend.contacts.segments.add({ email: contact.email, segmentId });
        }
        for (const segmentId of had) {
          if (!managed.has(segmentId) || contact.segmentIds.includes(segmentId)) continue;
          await pause(RESEND_GAP_MS);
          await resend.contacts.segments.remove({ email: contact.email, segmentId });
        }
        counts.updated += 1;
      } else {
        await pause(RESEND_GAP_MS);
        contactId = unwrap(
          await resend.contacts.create({
            email: contact.email,
            firstName: contact.firstName ?? undefined,
            lastName: contact.lastName ?? undefined,
            properties: contact.properties,
            segments: contact.segmentIds.map((id) => ({ id })),
          }),
          "Creating contact"
        ).id;
        counts.created += 1;
      }

      await admin.from("email_contact_sync").upsert({
        user_id: profile.id,
        email: contact.email,
        resend_contact_id: contactId,
        segment_ids: contact.segmentIds,
        fingerprint,
        synced_at: new Date().toISOString(),
        last_error: null,
      });
    } catch (syncError) {
      counts.failed += 1;
      await admin.from("email_contact_sync").upsert({
        user_id: profile.id,
        email: contact.email,
        segment_ids: previous?.segment_ids ?? [],
        fingerprint: previous?.fingerprint ?? null,
        last_error: syncError instanceof Error ? syncError.message : "Sync failed",
      });
    }
  }

  await putSetting(admin, "last_sync", { at: new Date().toISOString(), ...counts });
  return { ok: true, ...counts };
}

/** Signing secret for the Resend webhook: env var first, then the one saved by setup. */
export async function resolveWebhookSecret(admin: Admin | null): Promise<string | null> {
  if (process.env.RESEND_WEBHOOK_SECRET) return process.env.RESEND_WEBHOOK_SECRET;
  if (!admin) return null;
  return getSetting<string>(admin, "webhook_signing_secret");
}

const TRACKED = new Set<string>(TRACKED_EMAIL_EVENTS);

export function isTrackedEmailEvent(type: unknown): type is string {
  return typeof type === "string" && TRACKED.has(type);
}

/** Stores one webhook event; duplicates (Resend retries) are ignored by webhook_id. */
export async function recordEmailEvent(admin: Admin, webhookId: string | null, raw: unknown) {
  const event = raw as {
    type: string;
    created_at?: string;
    data?: {
      email_id?: string;
      broadcast_id?: string;
      to?: string[] | string;
      subject?: string;
      created_at?: string;
      click?: { link?: string };
    };
  };
  const data = event.data ?? {};
  const to = Array.isArray(data.to) ? data.to[0] : data.to;
  const row = {
    webhook_id: webhookId,
    type: event.type.replace(/^email\./, ""),
    email_id: data.email_id ?? null,
    broadcast_id: data.broadcast_id ?? null,
    recipient: to ? to.trim().toLowerCase() : null,
    subject: data.subject ?? null,
    link: data.click?.link ?? null,
    occurred_at: event.created_at || data.created_at || new Date().toISOString(),
  };
  const query = webhookId
    ? admin.from("email_events").upsert(row, { onConflict: "webhook_id", ignoreDuplicates: true })
    : admin.from("email_events").insert(row);
  const { error } = await query;
  if (error) console.warn("[email/events] could not store event:", error.message);
}

function emptyCounts(): EventCounts {
  return { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
}

function addCount(counts: EventCounts, type: string, recipients: number) {
  if (type in counts) counts[type as keyof EventCounts] += recipients;
}

type StatRow = { type: string; recipients: number };

/** Everything the Studio Email page shows: setup state, contacts and analytics. */
export async function getMarketingStatus(admin: Admin): Promise<MarketingStatus> {
  const errors: string[] = [];
  const [domain, segments, webhook, secret, setupAt, lastSync] = await Promise.all([
    getSetting<DomainSetting>(admin, "domain"),
    getSetting<SegmentIds>(admin, "segments"),
    getSetting<{ endpoint: string }>(admin, "webhook"),
    getSetting<string>(admin, "webhook_signing_secret"),
    getSetting<string>(admin, "setup_at"),
    getSetting<MarketingStatus["contacts"]["lastSync"]>(admin, "last_sync"),
  ]);

  const bySegment = Object.fromEntries(
    (Object.keys(MARKETING_SEGMENTS) as SegmentKey[]).map((key) => [key, 0])
  ) as Record<SegmentKey, number>;
  const { data: syncRows } = await admin
    .from("email_contact_sync")
    .select("segment_ids, last_error, resend_contact_id")
    .range(0, 9999);
  let synced = 0;
  let failed = 0;
  for (const row of (syncRows || []) as {
    segment_ids: string[];
    last_error: string | null;
    resend_contact_id: string | null;
  }[]) {
    if (row.resend_contact_id) synced += 1;
    if (row.last_error) failed += 1;
    if (!segments) continue;
    for (const [key, id] of Object.entries(segments) as [SegmentKey, string][]) {
      if (row.segment_ids.includes(id)) bySegment[key] += 1;
    }
  }

  const last30Days = { marketing: emptyCounts(), product: emptyCounts() };
  const { data: recent } = await admin
    .from("email_recent_stats")
    .select("stream, type, recipients");
  for (const row of (recent || []) as (StatRow & { stream: "marketing" | "product" })[]) {
    addCount(last30Days[row.stream], row.type, Number(row.recipients));
  }

  const broadcasts: BroadcastSummary[] = [];
  let topLinks: MarketingStatus["topLinks"] = null;
  const resend = resendClient();
  if (resend) {
    const listed = await resend.broadcasts.list({ limit: 10 });
    if (listed.error) {
      errors.push(`Broadcasts: ${listed.error.message}`);
    } else {
      const items = listed.data.data;
      const ids = items.map((b) => b.id);
      const statsById = new Map<string, EventCounts>();
      if (ids.length > 0) {
        const { data: stats } = await admin
          .from("email_broadcast_stats")
          .select("broadcast_id, type, recipients")
          .in("broadcast_id", ids);
        for (const row of (stats || []) as (StatRow & { broadcast_id: string })[]) {
          const counts = statsById.get(row.broadcast_id) ?? emptyCounts();
          addCount(counts, row.type, Number(row.recipients));
          statsById.set(row.broadcast_id, counts);
        }
      }

      for (const item of items) {
        let unsubscribed: number | null = null;
        if (item.status === "sent" && broadcasts.filter((b) => b.status === "sent").length < 5) {
          await pause(RESEND_GAP_MS);
          const unsubs = await resend.broadcasts.recipients(item.id, {
            type: "unsubscribed",
            limit: 100,
          });
          if (unsubs.data) unsubscribed = unsubs.data.data.length;
        }
        broadcasts.push({
          id: item.id,
          name: item.name,
          status: item.status,
          sentAt: item.sent_at,
          scheduledAt: item.scheduled_at,
          counts: statsById.get(item.id) ?? emptyCounts(),
          unsubscribed,
        });
      }

      const latestSent = broadcasts.find((b) => b.status === "sent");
      if (latestSent) {
        await pause(RESEND_GAP_MS);
        const clicked = await resend.broadcasts.clickedLinks(latestSent.id, { limit: 5 });
        if (clicked.data) {
          topLinks = {
            broadcastName: latestSent.name,
            links: clicked.data.data.map((link) => ({
              url: link.url,
              clicks: link.clicks,
              uniqueClicks: link.unique_clicks,
            })),
          };
        }
      }
    }
  }

  return {
    configured: {
      resendKey: Boolean(process.env.RESEND_API_KEY),
      cronSecret: Boolean(process.env.CRON_SECRET),
    },
    setupAt,
    domain,
    webhook: {
      connected: Boolean(webhook && (secret || process.env.RESEND_WEBHOOK_SECRET)),
      endpoint: webhook?.endpoint ?? null,
    },
    contacts: { synced, failed, bySegment, lastSync },
    last30Days,
    broadcasts,
    topLinks,
    errors,
  };
}
