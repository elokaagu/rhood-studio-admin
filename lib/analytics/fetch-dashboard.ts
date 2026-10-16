import { supabase } from "@/integrations/supabase/client";
import { averageDjRatings } from "@/lib/ratings/dj-ratings";
import type {
  AnalyticsDashboardData,
  TopUser,
  TopUsersData,
} from "@/lib/analytics/types";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const defaultTopUsers: TopUsersData = {
  mostActive: [],
  highestRating: [],
  upAndComing: [],
  leastActive: [],
};

const defaultAnalyticsDashboardData: AnalyticsDashboardData = {
  currentMonthSignups: 0,
  brandApplications: 0,
  dailyActiveUsers: 0,
  minutesPerUser: 0,
  monthlySignups: [],
  locationData: [],
  ageData: [
    { ageRange: "18-25", count: 0 },
    { ageRange: "26-35", count: 0 },
    { ageRange: "36-45", count: 0 },
    { ageRange: "46+", count: 0 },
  ],
  topUsers: defaultTopUsers,
};

function fromUntyped(table: string) {
  return (supabase as unknown as { from: (name: string) => any }).from(table);
}

function displayName(member: {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  dj_name?: string | null;
}): string {
  const fullName = `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim();
  return member.dj_name?.trim() || fullName || "Unknown DJ";
}

export async function fetchAnalyticsDashboardData(): Promise<AnalyticsDashboardData> {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const [
    membersCreatedRes,
    applicationsCountRes,
    profilesCityRes,
    dailyActiveRes,
    aiSessionsRes,
    todayApplicationsRes,
    todayMixesRes,
    todayMessagesRes,
    todayProfileUpdatesRes,
    djMembersRes,
    ratingsRes,
    completedGigsRes,
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("created_at")
      .order("created_at", { ascending: false }),
    supabase.from("applications").select("*", { count: "exact", head: true }),
    supabase.from("user_profiles").select("city").eq("role", "dj"),
    supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .gte("updated_at", todayIso),
    supabase
      .from("ai_insights_sessions")
      .select("processing_time_ms, user_id")
      .gte("created_at", todayIso)
      .not("processing_time_ms", "is", null),
    supabase.from("applications").select("user_id").gte("created_at", todayIso),
    supabase.from("mixes").select("uploaded_by").gte("created_at", todayIso),
    supabase.from("messages").select("sender_id").gte("created_at", todayIso),
    supabase.from("user_profiles").select("id").gte("updated_at", todayIso),
    supabase
      .from("user_profiles")
      .select("id, first_name, last_name, dj_name, role")
      .eq("role", "dj"),
    fromUntyped("ratings")
      .select("ratee_id, stars")
      .eq("rating_type", "dj_rating"),
    fromUntyped("applications")
      .select("user_id")
      .eq("status", "approved")
      .eq("gig_completed", true),
  ]);

  const membersData = membersCreatedRes.data ?? [];
  const monthlyMap = new Map<string, { count: number; sortOrder: number }>();

  membersData.forEach((member) => {
    if (!member.created_at) return;
    const date = new Date(member.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    const sortOrder = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { count: 0, sortOrder });
    }
    monthlyMap.get(monthKey)!.count += 1;
  });

  if (!monthlyMap.has(currentMonthKey)) {
    const currentSortOrder = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    monthlyMap.set(currentMonthKey, { count: 0, sortOrder: currentSortOrder });
  }

  const monthlyArray = Array.from(monthlyMap.entries())
    .map(([monthKey, { count, sortOrder }]) => {
      const [yearStr, monthStr] = monthKey.split("-");
      const year = Number.parseInt(yearStr, 10);
      const monthIndex = Number.parseInt(monthStr, 10) - 1;
      return {
        monthKey,
        month: `${monthNames[monthIndex]} ${year}`,
        signups: count,
        applications: 0,
        sortOrder,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const trimmedMonthlySignups = monthlyArray
    .slice(-6)
    .map(({ sortOrder, ...rest }) => rest);
  const currentMonthSignups =
    monthlyArray.find((entry) => entry.monthKey === currentMonthKey)?.signups ?? 0;

  const locationMap = new Map<string, number>();
  (profilesCityRes.data ?? []).forEach((profile) => {
    const location = profile.city?.trim() || "Unknown";
    locationMap.set(location, (locationMap.get(location) ?? 0) + 1);
  });
  const locationData = Array.from(locationMap.entries())
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const aiSessions = aiSessionsRes.data ?? [];
  const todayApplications = todayApplicationsRes.data ?? [];
  const todayMixes = todayMixesRes.data ?? [];
  const todayMessages = todayMessagesRes.data ?? [];
  const todayProfileUpdates = todayProfileUpdatesRes.data ?? [];

  const activeUserIds = new Set<string>();
  aiSessions.forEach((session) => {
    if (session.user_id) activeUserIds.add(session.user_id);
  });
  todayApplications.forEach((app) => {
    if (app.user_id) activeUserIds.add(app.user_id);
  });
  todayMixes.forEach((mix) => {
    if (mix.uploaded_by) activeUserIds.add(mix.uploaded_by);
  });
  todayMessages.forEach((msg) => {
    if (msg.sender_id) activeUserIds.add(msg.sender_id);
  });
  todayProfileUpdates.forEach((profile) => {
    activeUserIds.add(profile.id);
  });

  const totalProcessingTimeMs = aiSessions.reduce(
    (sum, session) => sum + (session.processing_time_ms || 0),
    0
  );
  const estimatedAdditionalMinutes =
    todayApplications.length * 2 +
    todayMixes.length * 5 +
    todayMessages.length * 1 +
    todayProfileUpdates.length * 1;
  const aiProcessingMinutes = totalProcessingTimeMs / 1000 / 60;
  const totalEngagementMinutes = aiProcessingMinutes + estimatedAdditionalMinutes;
  const minutesPerUser =
    activeUserIds.size > 0
      ? Math.round((totalEngagementMinutes / activeUserIds.size) * 10) / 10
      : 0;

  const ratingByDj = averageDjRatings(
    (!ratingsRes.error ? ratingsRes.data : []) as Array<{
      ratee_id: string | null;
      stars: number | null;
    }>
  );

  const gigsMap = new Map<string, number>();
  (completedGigsRes.data ?? []).forEach((application: { user_id: string | null }) => {
    if (!application.user_id) return;
    gigsMap.set(application.user_id, (gigsMap.get(application.user_id) ?? 0) + 1);
  });

  const djs = (djMembersRes.data ?? []) as Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    dj_name: string | null;
  }>;

  const usersWithStats: TopUser[] = djs.map((member) => {
    const rating = ratingByDj.get(member.id) ?? 0;
    const gigs = gigsMap.get(member.id) ?? 0;
    return {
      id: member.id,
      name: displayName(member),
      rating,
      gigs,
      status: gigs > 0 ? "active" : "upcoming",
    };
  });

  const sortedByGigs = [...usersWithStats].sort((a, b) => b.gigs - a.gigs);
  const withRatings = usersWithStats.filter((user) => user.rating > 0);
  const sortedByRating = [...withRatings].sort((a, b) => b.rating - a.rating);
  const upAndComing = usersWithStats
    .filter((user) => user.gigs === 0)
    .slice(0, 5);
  const leastActive = [...usersWithStats]
    .sort((a, b) => a.gigs - b.gigs || a.name.localeCompare(b.name))
    .slice(0, 5);

  return {
    ...defaultAnalyticsDashboardData,
    currentMonthSignups,
    brandApplications: applicationsCountRes.count || 0,
    dailyActiveUsers: dailyActiveRes.count || 0,
    minutesPerUser,
    monthlySignups: trimmedMonthlySignups,
    locationData,
    topUsers: {
      mostActive: sortedByGigs.slice(0, 5),
      highestRating: sortedByRating.slice(0, 5),
      upAndComing,
      leastActive,
    },
  };
}
