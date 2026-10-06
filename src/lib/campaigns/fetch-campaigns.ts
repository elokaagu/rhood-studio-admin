import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/date-utils";
import { displayName } from "@/lib/email/helpers";
import {
  assessCampaign,
  classifySender,
  type CampaignEmail,
  type CampaignOwner,
  type CampaignPlacement,
  type CampaignRow,
} from "@/lib/campaigns/status";

function fromUntyped(table: string) {
  return (supabase as unknown as { from: (name: string) => any }).from(table);
}

type OppRow = {
  id: string;
  title: string | null;
  location: string | null;
  event_date: string | null;
  event_timezone?: string | null;
  organizer_name: string | null;
  organizer_id: string | null;
  created_by?: string | null;
  listing_status: string | null;
  is_archived: boolean | null;
  is_active: boolean | null;
};

type AppRow = {
  id: string;
  opportunity_id: string | null;
  status: string | null;
  user_id: string | null;
  created_at: string | null;
  gig_completed?: boolean | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  dj_name: string | null;
  first_name: string | null;
  last_name: string | null;
  brand_name: string | null;
};

type EventRow = {
  application_id: string;
  kind: string;
  source: string | null;
  created_at: string;
};

const OWNER_RANK: Record<CampaignOwner, number> = {
  rhood: 0,
  brand: 1,
  dj: 1,
  replies: 2,
  applicants: 3,
  done: 4,
};

function normaliseStatus(value: string | null): CampaignPlacement["status"] {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

export async function fetchCampaignBoard(): Promise<
  { ok: true; campaigns: CampaignRow[] } | { ok: false; message: string }
> {
  const columns =
    "id, title, location, event_date, event_timezone, organizer_name, organizer_id, created_by, listing_status, is_archived, is_active";
  let oppQuery = await fromUntyped("opportunities")
    .select(columns)
    .order("created_at", { ascending: false });
  if (oppQuery.error && /event_timezone|created_by/i.test(oppQuery.error.message || "")) {
    oppQuery = await fromUntyped("opportunities")
      .select(
        "id, title, location, event_date, organizer_name, organizer_id, listing_status, is_archived, is_active"
      )
      .order("created_at", { ascending: false });
  }
  if (oppQuery.error) {
    return { ok: false, message: oppQuery.error.message || "Failed to load campaigns." };
  }

  const opportunities = ((oppQuery.data || []) as OppRow[]).filter(
    (row) => row.listing_status !== "draft" && !row.is_archived
  );
  if (opportunities.length === 0) return { ok: true, campaigns: [] };

  const oppIds = opportunities.map((row) => row.id);
  let appQuery = await fromUntyped("applications")
    .select("id, opportunity_id, status, user_id, created_at, gig_completed")
    .in("opportunity_id", oppIds);
  if (appQuery.error && /gig_completed/i.test(appQuery.error.message || "")) {
    appQuery = await fromUntyped("applications")
      .select("id, opportunity_id, status, user_id, created_at")
      .in("opportunity_id", oppIds);
  }
  if (appQuery.error) {
    return { ok: false, message: appQuery.error.message || "Failed to load applications." };
  }
  const applications = (appQuery.data || []) as AppRow[];
  const appIds = applications.map((row) => row.id);

  const ownerIds = opportunities.flatMap((row) =>
    [row.organizer_id, row.created_by].filter((id): id is string => Boolean(id))
  );
  const userIds = Array.from(
    new Set([...applications.map((row) => row.user_id), ...ownerIds].filter(Boolean))
  ) as string[];

  const [profilesResult, eventsResult, threadsResult] = await Promise.all([
    userIds.length
      ? fromUntyped("user_profiles")
          .select("id, email, dj_name, first_name, last_name, brand_name")
          .in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
    appIds.length
      ? fromUntyped("campaign_events")
          .select("application_id, kind, source, created_at")
          .in("application_id", appIds)
      : Promise.resolve({ data: [], error: null }),
    fromUntyped("campaign_threads")
      .select("id, opportunity_id, application_id")
      .in("opportunity_id", oppIds),
  ]);

  const profilesById = new Map<string, ProfileRow>();
  for (const profile of (profilesResult.data || []) as ProfileRow[]) {
    profilesById.set(profile.id, profile);
  }

  const introByApp = new Map<string, { at: string; source: "sent" | "marked" }>();
  for (const event of (eventsResult.data || []) as EventRow[]) {
    if (event.kind !== "intro_email") continue;
    introByApp.set(event.application_id, {
      at: event.created_at,
      source: event.source === "marked" ? "marked" : "sent",
    });
  }

  const threads = (threadsResult.data || []) as Array<{
    id: string;
    opportunity_id: string | null;
    application_id: string | null;
  }>;
  const threadById = new Map(threads.map((t) => [t.id, t]));
  type MessageRow = {
    id: string;
    thread_id: string;
    direction: string;
    from_email: string | null;
    body_text: string | null;
    subject: string | null;
    received_at: string;
  };
  let messages: MessageRow[] = [];
  if (threads.length > 0) {
    const { data } = await fromUntyped("campaign_messages")
      .select("id, thread_id, direction, from_email, body_text, subject, received_at")
      .in(
        "thread_id",
        threads.map((t) => t.id)
      )
      .order("received_at", { ascending: true });
    messages = (data || []) as MessageRow[];
  }

  const appsByOpp = new Map<string, AppRow[]>();
  for (const app of applications) {
    if (!app.opportunity_id) continue;
    const list = appsByOpp.get(app.opportunity_id) ?? [];
    list.push(app);
    appsByOpp.set(app.opportunity_id, list);
  }

  const campaigns: CampaignRow[] = opportunities.map((opp) => {
    const apps = appsByOpp.get(opp.id) ?? [];
    const brandProfile =
      (opp.organizer_id && profilesById.get(opp.organizer_id)) ||
      (opp.created_by && profilesById.get(opp.created_by)) ||
      null;
    const brandEmail = brandProfile?.email ?? null;
    const djEmailByApp = new Map<string, string | null>();

    const placements: CampaignPlacement[] = apps.map((app) => {
      const profile = app.user_id ? profilesById.get(app.user_id) : undefined;
      const djEmail = profile?.email ?? null;
      djEmailByApp.set(app.id, djEmail);
      const intro = introByApp.get(app.id);
      return {
        applicationId: app.id,
        djName: displayName(profile ?? { email: djEmail }),
        djEmail,
        status: normaliseStatus(app.status),
        appliedAt: app.created_at,
        introAt: intro?.at ?? null,
        introSource: intro?.source ?? null,
        gigCompleted: Boolean(app.gig_completed),
        lastReplyFrom: null,
        lastReplyAt: null,
      };
    });
    const placementById = new Map(placements.map((p) => [p.applicationId, p]));

    const emails: CampaignEmail[] = messages
      .filter((m) => threadById.get(m.thread_id)?.opportunity_id === opp.id)
      .map((m) => {
        const applicationId = threadById.get(m.thread_id)?.application_id ?? null;
        const djEmail = applicationId ? djEmailByApp.get(applicationId) ?? null : null;
        const direction = m.direction === "outbound" ? "outbound" : "inbound";
        return {
          id: m.id,
          applicationId,
          direction,
          fromEmail: m.from_email,
          sender:
            direction === "outbound"
              ? "rhood"
              : classifySender(m.from_email, brandEmail, djEmail),
          bodyText: m.body_text,
          subject: m.subject,
          receivedAt: m.received_at,
        };
      });

    for (const email of emails) {
      if (email.direction !== "inbound" || email.sender === "rhood") continue;
      const placement = email.applicationId
        ? placementById.get(email.applicationId)
        : undefined;
      if (!placement) continue;
      placement.lastReplyFrom = email.sender;
      placement.lastReplyAt = email.receivedAt;
    }

    const listingLive = opp.is_active !== false && opp.listing_status !== "pending";
    const eventLabel = opp.event_date ? formatDate(opp.event_date, opp.event_timezone) : null;
    const assessment = assessCampaign({
      listingLive,
      eventAt: opp.event_date,
      eventLabel,
      placements,
    });

    return {
      ...assessment,
      opportunityId: opp.id,
      title: opp.title?.trim() || "Untitled campaign",
      brandName:
        opp.organizer_name?.trim() || brandProfile?.brand_name?.trim() || "Brand",
      brandEmail,
      location: opp.location,
      eventAt: opp.event_date,
      eventLabel,
      listingLive,
      placements,
      emails,
    };
  });

  campaigns.sort((a, b) => {
    const rank = OWNER_RANK[a.owner] - OWNER_RANK[b.owner];
    if (rank !== 0) return rank;
    const at = a.eventAt ? new Date(a.eventAt).getTime() : Number.POSITIVE_INFINITY;
    const bt = b.eventAt ? new Date(b.eventAt).getTime() : Number.POSITIVE_INFINITY;
    return at - bt;
  });

  return { ok: true, campaigns };
}

export async function updateCampaignIntro(
  applicationId: string,
  action: "send" | "mark"
): Promise<{ ok: true } | { ok: false; message: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) return { ok: false, message: "You must be signed in." };
  try {
    const response = await fetch("/api/campaigns/intro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ applicationId, action }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      return { ok: false, message: payload.error || "Could not update the intro." };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not reach Studio. Try again." };
  }
}
