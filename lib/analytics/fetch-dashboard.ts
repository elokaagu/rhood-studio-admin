import { supabase } from "@/integrations/supabase/client";
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
    opportunitiesRes,
    profilesCityRes,
    dailyActiveRes,
    aiSessionsRes,
    todayApplicationsRes,
    todayMixesRes,
    todayMessagesRes,
    todayProfileUpdatesRes,
    allMembersRes,
    feedbackRes,
    allApplicationsRes,
  ] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("created_at")
      .order("created_at", { ascending: false }),
    supabase.from("opportunities").select("*", { count: "exact", head: true }),
    supabase.from("user_profiles").select("city"),
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
    supabase.from("user_profiles").select("id, first_name, last_name, dj_name"),
    supabase.from("ai_matching_feedback").select("user_id, rating"),
    // `gig_completed` exists in runtime schema but may be missing from generated types.
    (supabase as any)
      .from("applications")
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
    const location = profile.city || "Unknown";
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

  const ratingMap = new Map<string, { total: number; count: number }>();
  (feedbackRes.data ?? []).forEach((item) => {
    if (!item.user_id) return;
    const current = ratingMap.get(item.user_id) ?? { total: 0, count: 0 };
    ratingMap.set(item.user_id, {
      total: current.total + (item.rating ?? 0),
      count: current.count + 1,
    });
  });

  const gigsMap = new Map<string, number>();
  (allApplicationsRes.data ?? []).forEach((application: { user_id: string | null }) => {
    if (!application.user_id) return;
    gigsMap.set(application.user_id, (gigsMap.get(application.user_id) ?? 0) + 1);
  });

  const usersWithStats: TopUser[] = (allMembersRes.data ?? []).map((member) => {
    const ratingStats = ratingMap.get(member.id);
    const rating =
      ratingStats && ratingStats.count > 0 ? ratingStats.total / ratingStats.count : 0;
    const gigs = gigsMap.get(member.id) ?? 0;
    const fullName = `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim();
    return {
      id: member.id,
      name: member.dj_name || fullName || "Unknown Member",
      rating,
      gigs,
      status: rating > 3 ? "active" : rating > 1 ? "upcoming" : "inactive",
    };
  });

  const sortedByGigs = [...usersWithStats].sort((a, b) => b.gigs - a.gigs);
  const sortedByRating = [...usersWithStats].sort((a, b) => b.rating - a.rating);
  const sortedByRecent = usersWithStats.filter((user) => user.gigs === 0);

  return {
    ...defaultAnalyticsDashboardData,
    currentMonthSignups,
    brandApplications: opportunitiesRes.count || 0,
    dailyActiveUsers: dailyActiveRes.count || 0,
    minutesPerUser,
    monthlySignups: trimmedMonthlySignups,
    locationData,
    topUsers: {
      mostActive: sortedByGigs.slice(0, 5),
      highestRating: sortedByRating.slice(0, 5),
      upAndComing: sortedByRecent.slice(0, 5),
      leastActive: sortedByGigs.slice(-5).reverse(),
    },
  };
}
