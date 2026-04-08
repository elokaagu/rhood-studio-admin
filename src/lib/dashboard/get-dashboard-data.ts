import { supabase } from "@/integrations/supabase/client";
import { formatDateShort } from "@/lib/date-utils";

export type ViewerContext = {
  userId: string | null;
  role: string | null;
};

export type DashboardStat = {
  title: string;
  value: string;
};

export type ActivityItem = {
  type: "application" | "opportunity" | "member";
  message: string;
  createdAt: string;
  time: string;
};

export type UpcomingEvent = {
  title: string;
  date: string;
  time: string;
  genre: string;
  location: string | null;
};

export type DashboardData = {
  stats: DashboardStat[];
  recentActivity: ActivityItem[];
  upcomingEvents: UpcomingEvent[];
};

function toEventDateLabel(iso: string): string {
  const eventDate = new Date(iso);
  const now = new Date();
  const diffTime = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return formatDateShort(eventDate);
}

export async function getDashboardData(viewer: ViewerContext): Promise<DashboardData> {
  const isBrand = viewer.role === "brand" && !!viewer.userId;
  const isAdmin = viewer.role === "admin";

  let brandOpportunityIds: string[] = [];
  if (isBrand && viewer.userId) {
    const { data: brandOpportunities } = await supabase
      .from("opportunities")
      .select("id")
      .eq("organizer_id", viewer.userId);
    brandOpportunityIds = (brandOpportunities ?? []).map((x) => x.id);
  }

  let activeOppCountQuery = supabase
    .from("opportunities")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  let pendingAppsCountQuery = supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (isBrand && viewer.userId) {
    activeOppCountQuery = activeOppCountQuery.eq("organizer_id", viewer.userId);
    if (brandOpportunityIds.length > 0) {
      pendingAppsCountQuery = pendingAppsCountQuery.in("opportunity_id", brandOpportunityIds);
    } else {
      pendingAppsCountQuery = pendingAppsCountQuery.eq("id", "00000000-0000-0000-0000-000000000000");
    }
  }

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    activeOppCountRes,
    pendingAppsCountRes,
    memberCountRes,
    mixesCountRes,
    recentAppsRes,
    recentOppsRes,
    recentUsersRes,
    upcomingEventsRes,
  ] = await Promise.all([
    activeOppCountQuery,
    pendingAppsCountQuery,
    isAdmin
      ? supabase.from("user_profiles").select("id", { count: "exact", head: true })
      : Promise.resolve({ count: 0, data: null, error: null }),
    isAdmin
      ? supabase
          .from("mixes")
          .select("id", { count: "exact", head: true })
          .gte("created_at", monthStart.toISOString())
      : Promise.resolve({ count: 0, data: null, error: null }),
    (() => {
      let q = supabase
        .from("applications")
        .select(
          "id, created_at, opportunities!inner(title, organizer_id), user_profiles!inner(dj_name)"
        )
        .order("created_at", { ascending: false })
        .limit(4);
      if (isBrand && viewer.userId) {
        q = q.eq("opportunities.organizer_id", viewer.userId);
      }
      return q;
    })(),
    (() => {
      let q = supabase
        .from("opportunities")
        .select("id, title, created_at, organizer_id")
        .order("created_at", { ascending: false })
        .limit(3);
      if (isBrand && viewer.userId) {
        q = q.eq("organizer_id", viewer.userId);
      }
      return q;
    })(),
    isAdmin
      ? supabase
          .from("user_profiles")
          .select("id, dj_name, created_at")
          .order("created_at", { ascending: false })
          .limit(2)
      : Promise.resolve({ data: [], error: null }),
    (() => {
      let q = supabase
        .from("opportunities")
        .select("id, title, event_date, genre, location, organizer_id")
        .eq("is_active", true)
        .not("event_date", "is", null)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true })
        .limit(3);
      if (isBrand && viewer.userId) {
        q = q.eq("organizer_id", viewer.userId);
      }
      return q;
    })(),
  ]);

  const stats: DashboardStat[] = [
    { title: "Active Opportunities", value: String(activeOppCountRes.count ?? 0) },
    { title: "Pending Applications", value: String(pendingAppsCountRes.count ?? 0) },
  ];

  if (isAdmin) {
    stats.push(
      { title: "Total Members", value: String(memberCountRes.count ?? 0) },
      { title: "New Mixes", value: String(mixesCountRes.count ?? 0) }
    );
  }

  const activities: ActivityItem[] = [];

  const apps = (recentAppsRes.data ?? []) as Array<{
    created_at: string | null;
    opportunities: { title: string; organizer_id: string | null };
    user_profiles: { dj_name: string | null };
  }>;
  for (const app of apps) {
    if (!app.created_at) continue;
    activities.push({
      type: "application",
      message: `${app.user_profiles?.dj_name || "A member"} applied to ${app.opportunities?.title || "an opportunity"}`,
      createdAt: app.created_at,
      time: formatDateShort(app.created_at),
    });
  }

  const opps = (recentOppsRes.data ?? []) as Array<{ created_at: string | null; title: string }>;
  for (const opp of opps) {
    if (!opp.created_at) continue;
    activities.push({
      type: "opportunity",
      message: `New opportunity posted: ${opp.title}`,
      createdAt: opp.created_at,
      time: formatDateShort(opp.created_at),
    });
  }

  const users = (recentUsersRes.data ?? []) as Array<{ created_at: string | null; dj_name: string | null }>;
  for (const user of users) {
    if (!user.created_at) continue;
    activities.push({
      type: "member",
      message: `${user.dj_name || "A member"} joined the platform`,
      createdAt: user.created_at,
      time: formatDateShort(user.created_at),
    });
  }

  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const upcomingEvents: UpcomingEvent[] = ((upcomingEventsRes.data ?? []) as Array<{
    title: string;
    event_date: string | null;
    genre: string | null;
    location: string | null;
  }>)
    .filter((opp) => !!opp.event_date)
    .map((opp) => {
      const iso = opp.event_date as string;
      const d = new Date(iso);
      return {
        title: opp.title,
        date: toEventDateLabel(iso),
        time: d.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        genre: opp.genre || "General",
        location: opp.location,
      };
    });

  return {
    stats,
    recentActivity: activities.slice(0, 4),
    upcomingEvents,
  };
}
