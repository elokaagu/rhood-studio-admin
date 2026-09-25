import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/date-utils";
import { displayName } from "@/lib/email/helpers";
import {
  campaignDeliverables,
  classifySender,
  hoursSince,
  nextStepFromDeliverables,
  stageAndBriefing,
  statusUpdateCopy,
  trafficLightForStage,
  type CampaignEmail,
  type CampaignPlacement,
  type CampaignRow,
  type CampaignDeliverable,
  type TrafficLight,
} from "@/lib/campaigns/status";

function fromUntyped(table: string) {
  return (supabase as unknown as { from: (name: string) => any }).from(table);
}

export type CampaignBoardRow = CampaignRow & {
  light: TrafficLight;
  deliverables: CampaignDeliverable[];
  next: string;
  emailNote: string;
};

type OppRow = {
  id: string;
  title: string | null;
  location: string | null;
  event_date: string | null;
  event_timezone?: string | null;
  organizer_name: string | null;
  organizer_id: string | null;
  listing_status: string | null;
  is_archived: boolean | null;
  is_active: boolean | null;
};

type AppRow = {
  id: string;
  opportunity_id: string | null;
  status: string | null;
  user_id: string | null;
  gig_completed?: boolean | null;
};

function tableMissing(message: string | undefined) {
  return (message || "").toLowerCase().includes("does not exist");
}

export async function fetchCampaignBoard(): Promise<
  { ok: true; campaigns: CampaignBoardRow[] } | { ok: false; message: string }
> {
  const withTimezone =
    "id, title, location, event_date, event_timezone, organizer_name, organizer_id, listing_status, is_archived, is_active";
  const withoutTimezone =
    "id, title, location, event_date, organizer_name, organizer_id, listing_status, is_archived, is_active";

  let oppQuery = await fromUntyped("opportunities")
    .select(withTimezone)
    .order("created_at", { ascending: false });
  if (oppQuery.error && /event_timezone/i.test(oppQuery.error.message || "")) {
    oppQuery = await fromUntyped("opportunities")
      .select(withoutTimezone)
      .order("created_at", { ascending: false });
  }

  const { data: oppData, error: oppError } = oppQuery;

  if (oppError) {
    return { ok: false, message: oppError.message || "Failed to load campaigns." };
  }

  const opportunities = ((oppData || []) as OppRow[]).filter(
    (row) => row.listing_status !== "draft" && !row.is_archived
  );
  if (opportunities.length === 0) {
    return { ok: true, campaigns: [] };
  }

  const oppIds = opportunities.map((row) => row.id);
  let appQuery = await fromUntyped("applications")
    .select("id, opportunity_id, status, user_id, gig_completed")
    .in("opportunity_id", oppIds);
  if (appQuery.error && String(appQuery.error.message || "").includes("gig_completed")) {
    appQuery = await fromUntyped("applications")
      .select("id, opportunity_id, status, user_id")
      .in("opportunity_id", oppIds);
  }

  const applications = (appQuery.data || []) as AppRow[];
  const organizerIds = opportunities
    .map((row) => row.organizer_id)
    .filter((id): id is string => Boolean(id));
  const userIds = Array.from(
    new Set(
      [...applications.map((row) => row.user_id), ...organizerIds].filter(Boolean)
    )
  ) as string[];

  const profilesById = new Map<
    string,
    { email: string | null; dj_name: string | null; first_name: string | null; last_name: string | null; brand_name: string | null }
  >();
  if (userIds.length > 0) {
    const { data: profiles } = await fromUntyped("user_profiles")
      .select("id, email, dj_name, first_name, last_name, brand_name")
      .in("id", userIds);
    for (const profile of profiles || []) {
      profilesById.set(profile.id, profile);
    }
  }

  const relatedIds = [
    ...applications.map((row) => row.id),
    ...applications
      .filter((row) => row.opportunity_id && row.user_id)
      .map((row) => `${row.opportunity_id}:${row.user_id}`),
  ];
  const introIds = new Set<string>();
  const introAtByRelated = new Map<string, string>();
  if (relatedIds.length > 0) {
    const { data: notes } = await fromUntyped("notifications")
      .select("related_id, type, created_at")
      .in("related_id", relatedIds)
      .eq("type", "application_intro");
    for (const note of notes || []) {
      if (!note.related_id) continue;
      const id = String(note.related_id);
      introIds.add(id);
      if (note.created_at) introAtByRelated.set(id, String(note.created_at));
    }
  }

  const emailsByOpportunity = new Map<string, CampaignEmail[]>();
  const emailsByApplication = new Map<string, CampaignEmail[]>();
  const threads = await fromUntyped("campaign_threads")
    .select("id, opportunity_id, application_id, brand_email, dj_email")
    .in("opportunity_id", oppIds);
  if (!threads.error && Array.isArray(threads.data) && threads.data.length > 0) {
    const threadIds = threads.data.map((row: { id: string }) => row.id);
    const messages = await fromUntyped("campaign_messages")
      .select("id, thread_id, direction, from_email, body_text, subject, received_at")
      .in("thread_id", threadIds)
      .order("received_at", { ascending: true });
    const threadMeta = new Map<
      string,
      { opportunityId: string | null; applicationId: string | null }
    >();
    for (const thread of threads.data as Array<{
      id: string;
      opportunity_id: string | null;
      application_id: string | null;
    }>) {
      threadMeta.set(thread.id, {
        opportunityId: thread.opportunity_id,
        applicationId: thread.application_id,
      });
    }
    for (const message of (messages.data || []) as Array<{
      id: string;
      thread_id: string;
      direction: string;
      from_email: string | null;
      body_text: string | null;
      subject: string | null;
      received_at: string;
    }>) {
      const meta = threadMeta.get(message.thread_id);
      const email: CampaignEmail = {
        id: message.id,
        direction: message.direction === "outbound" ? "outbound" : "inbound",
        fromEmail: message.from_email,
        bodyText: message.body_text,
        subject: message.subject,
        receivedAt: message.received_at,
      };
      if (meta?.opportunityId) {
        const list = emailsByOpportunity.get(meta.opportunityId) ?? [];
        list.push(email);
        emailsByOpportunity.set(meta.opportunityId, list);
      }
      if (meta?.applicationId) {
        const list = emailsByApplication.get(meta.applicationId) ?? [];
        list.push(email);
        emailsByApplication.set(meta.applicationId, list);
      }
    }
  } else if (threads.error && !tableMissing(threads.error.message)) {
    console.warn("[campaigns]", threads.error.message);
  }

  const appsByOpp = new Map<string, AppRow[]>();
  for (const app of applications) {
    if (!app.opportunity_id) continue;
    const list = appsByOpp.get(app.opportunity_id) ?? [];
    list.push(app);
    appsByOpp.set(app.opportunity_id, list);
  }

  const campaigns: CampaignBoardRow[] = opportunities.map((opp) => {
    const apps = appsByOpp.get(opp.id) ?? [];
    const emails = emailsByOpportunity.get(opp.id) ?? [];
    const pending = apps.filter((app) => (app.status || "pending") === "pending").length;
    const approved = apps.filter((app) => app.status === "approved").length;
    const rejected = apps.filter((app) => app.status === "rejected").length;

    const brandEmail =
      (opp.organizer_id && profilesById.get(opp.organizer_id)?.email) || null;
    const placements: CampaignPlacement[] = apps.map((app) => {
      const profile = app.user_id ? profilesById.get(app.user_id) : undefined;
      const djEmail = profile?.email ?? null;
      const placementEmails = emailsByApplication.get(app.id) ?? emails;
      const latest = [...placementEmails].sort(
        (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      )[0];
      const introSent =
        (emailsByApplication.get(app.id) ?? []).some((e) => e.direction === "outbound") ||
        introIds.has(app.id) ||
        Boolean(app.opportunity_id && app.user_id && introIds.has(`${app.opportunity_id}:${app.user_id}`));
      const introAt =
        (emailsByApplication.get(app.id) ?? []).find((e) => e.direction === "outbound")
          ?.receivedAt ||
        introAtByRelated.get(app.id) ||
        (app.opportunity_id && app.user_id
          ? introAtByRelated.get(`${app.opportunity_id}:${app.user_id}`)
          : undefined) ||
        null;
      return {
        applicationId: app.id,
        djName: displayName(profile ?? { email: djEmail }),
        djEmail,
        status: app.status || "pending",
        introSent,
        gigCompleted: Boolean(app.gig_completed),
        lastEmailFrom: classifySender(latest?.fromEmail ?? null, brandEmail, djEmail),
        lastEmailAt: latest?.receivedAt ?? null,
        hoursSinceActivity: hoursSince(latest?.receivedAt ?? introAt),
      };
    });

    const hasInbound = emails.some((email) => email.direction === "inbound");
    const { stage, briefing } = stageAndBriefing({
      pending,
      approved,
      rejected,
      placements,
      hasInbound,
    });
    const deliverables = campaignDeliverables({
      pending,
      approved,
      rejected,
      placements,
      emails,
      listingActive: opp.is_active !== false && opp.listing_status !== "pending",
    });
    const next = nextStepFromDeliverables(deliverables);
    const copy = statusUpdateCopy({ briefing, next, emails });
    const lastActivityAt =
      emails[emails.length - 1]?.receivedAt ||
      placements
        .map((p) => p.lastEmailAt)
        .filter(Boolean)
        .sort()
        .at(-1) ||
      null;

    return {
      opportunityId: opp.id,
      title: opp.title?.trim() || "Untitled campaign",
      brandName: opp.organizer_name?.trim() || "Brand",
      location: opp.location,
      eventLabel: opp.event_date ? formatDate(opp.event_date, opp.event_timezone) : null,
      pending,
      approved,
      rejected,
      stage,
      briefing: copy.where,
      lastActivityAt,
      placements,
      emails,
      light: trafficLightForStage(stage),
      deliverables,
      next: copy.next,
      emailNote: copy.emailNote,
    };
  });

  campaigns.sort((a, b) => {
    const rank = { red: 0, yellow: 1, green: 2 };
    return rank[a.light] - rank[b.light];
  });

  return { ok: true, campaigns };
}
