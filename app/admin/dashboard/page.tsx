"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { textStyles } from "@/lib/typography";
import { formatDateShort } from "@/lib/date-utils";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserProfile, getCurrentUserId } from "@/lib/auth-utils";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [activityLoaded, setActivityLoaded] = useState(false);

  const [stats, setStats] = useState([
    {
      title: "Active Opportunities",
      value: "0",
    },
    {
      title: "Pending Applications",
      value: "0",
    },
    {
      title: "Total Members",
      value: "0",
    },
    {
      title: "New Mixes",
      value: "0",
    },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userProfile = await getCurrentUserProfile();
        const userId = await getCurrentUserId();

        // Build queries based on user role
        let opportunitiesQuery = supabase
          .from("opportunities")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        let applicationsQuery = supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // Brands can only see their own opportunities and applications
        if (userProfile?.role === "brand" && userId) {
          // Get brand's opportunity IDs
          const { data: brandOpportunities } = await supabase
            .from("opportunities")
            .select("id")
            .eq("organizer_id", userId);
          const brandOpportunityIds =
            brandOpportunities?.map((opp) => opp.id) || [];

          opportunitiesQuery = opportunitiesQuery.eq("organizer_id", userId);

          if (brandOpportunityIds.length > 0) {
            applicationsQuery = applicationsQuery.in(
              "opportunity_id",
              brandOpportunityIds
            );
          } else {
            // No opportunities, so no applications
            applicationsQuery = applicationsQuery.eq("id", "00000000-0000-0000-0000-000000000000"); // Impossible ID to return 0
          }
        }

        // Fetch opportunities count
        const { count: opportunitiesCount } = await opportunitiesQuery;

        // Fetch applications count
        const { count: applicationsCount } = await applicationsQuery;

        // Only admins see members and mixes
        let membersCount = 0;
        let mixesThisMonthCount = 0;

        if (userProfile?.role === "admin") {
          // Fetch user profiles count
          const { count: membersCountResult } = await supabase
            .from("user_profiles")
            .select("*", { count: "exact", head: true });
          membersCount = membersCountResult || 0;

          // Fetch mixes uploaded this month
          const monthStart = new Date();
          monthStart.setDate(1);
          monthStart.setHours(0, 0, 0, 0);

          const { count: mixesCount } = await supabase
            .from("mixes")
            .select("*", { count: "exact", head: true })
            .gte("created_at", monthStart.toISOString());
          mixesThisMonthCount = mixesCount || 0;
        }

        // Build stats array based on role
        const statsArray = [
          {
            title: "Active Opportunities",
            value: opportunitiesCount?.toString() || "0",
          },
          {
            title: "Pending Applications",
            value: applicationsCount?.toString() || "0",
          },
        ];

        // Only show members and mixes for admins
        if (userProfile?.role === "admin") {
          statsArray.push(
            {
              title: "Total Members",
              value: membersCount.toString(),
            },
            {
              title: "New Mixes",
              value: mixesThisMonthCount.toString(),
            }
          );
        }

        setStats(statsArray);
        setStatsLoaded(true);
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStatsLoaded(true);
      }
    };

    fetchStats();
  }, []);

  const [recentActivity, setRecentActivity] = useState([
    {
      type: "loading",
      message: "Loading recent activity...",
      time: "",
    },
  ]);

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const userProfile = await getCurrentUserProfile();
        const userId = await getCurrentUserId();

        // Build queries based on user role
        let applicationsQuery = supabase
          .from("applications")
          .select(
            `
            id,
            created_at,
            status,
            opportunities!inner(title, organizer_id),
            user_profiles!inner(dj_name)
          `
          );

        let opportunitiesQuery = supabase
          .from("opportunities")
          .select("id, title, created_at, organizer_id");

        // Brands can only see their own opportunities and applications
        if (userProfile?.role === "brand" && userId) {
          applicationsQuery = applicationsQuery.eq(
            "opportunities.organizer_id",
            userId
          );
          opportunitiesQuery = opportunitiesQuery.eq("organizer_id", userId);
        }

        // Fetch recent applications
        const { data: recentApplications } = await applicationsQuery
          .order("created_at", { ascending: false })
          .limit(3);

        // Fetch recent opportunities
        const { data: recentOpportunities } = await opportunitiesQuery
          .order("created_at", { ascending: false })
          .limit(2);

        // Only admins see user registrations
        let recentUsers: any[] = [];
        if (userProfile?.role === "admin") {
          const { data: usersData } = await supabase
            .from("user_profiles")
            .select("id, dj_name, created_at")
            .order("created_at", { ascending: false })
            .limit(2);
          recentUsers = usersData || [];
        }

        const activities: Array<{
          type: string;
          message: string;
          time: string;
        }> = [];

        // Add recent applications
        if (recentApplications) {
          recentApplications.forEach((app: any) => {
            activities.push({
              type: "application",
              message: `${app.user_profiles.dj_name} applied to ${app.opportunities.title}`,
              time: formatDateShort(app.created_at),
            });
          });
        }

        // Add recent opportunities
        if (recentOpportunities) {
          recentOpportunities.forEach((opp: any) => {
            activities.push({
              type: "opportunity",
              message: `New opportunity posted: ${opp.title}`,
              time: formatDateShort(opp.created_at),
            });
          });
        }

        // Add recent users
        if (recentUsers) {
          recentUsers.forEach((user: any) => {
            activities.push({
              type: "member",
              message: `${user.dj_name} joined the platform`,
              time: formatDateShort(user.created_at),
            });
          });
        }

        // Sort by date and take top 4
        activities.sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
        );
        setRecentActivity(activities.slice(0, 4));
        setActivityLoaded(true);
      } catch (error) {
        console.error("Error fetching recent activity:", error);
        setRecentActivity([
          {
            type: "error",
            message: "Failed to load recent activity",
            time: "",
          },
        ]);
        setActivityLoaded(true);
      }
    };

    fetchRecentActivity();
  }, []);

  // Fetch upcoming events from opportunities table
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        const userProfile = await getCurrentUserProfile();
        const userId = await getCurrentUserId();

        // Build query based on user role
        let query = supabase
          .from("opportunities")
          .select("title, event_date, genre, location, organizer_id")
          .eq("is_active", true)
          .not("event_date", "is", null)
          .gte("event_date", new Date().toISOString());

        // Brands can only see their own opportunities
        if (userProfile?.role === "brand" && userId) {
          query = query.eq("organizer_id", userId);
        }

        // Fetch opportunities with event dates in the future
        const { data: opportunities, error } = await query
          .order("event_date", { ascending: true })
          .limit(3);

        if (error) {
          console.error("Error fetching upcoming events:", error);
          // Fallback to demo data if database error
          setUpcomingEvents([
            {
              title: "Underground Warehouse Rave",
              date: "Tomorrow",
              time: "8:00 PM",
              genre: "Techno",
            },
            {
              title: "Rooftop Summer Sessions",
              date: "Aug 20",
              time: "6:00 PM",
              genre: "House",
            },
            {
              title: "Club Residency Audition",
              date: "Aug 25",
              time: "9:00 PM",
              genre: "Drum & Bass",
            },
          ]);
          setEventsLoaded(true);
          return;
        }

        if (opportunities && opportunities.length > 0) {
          // Transform opportunities data to match the expected format
          const transformedEvents = opportunities.map((opp: any) => {
            const eventDate = new Date(opp.event_date);
            const now = new Date();
            const diffTime = eventDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let dateDisplay = "";
            if (diffDays === 1) {
              dateDisplay = "Tomorrow";
            } else if (diffDays === 0) {
              dateDisplay = "Today";
            } else {
              dateDisplay = formatDateShort(eventDate);
            }

            return {
              title: opp.title,
              date: dateDisplay,
              time: eventDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }),
              genre: opp.genre || "General",
              location: opp.location,
            };
          });

          setUpcomingEvents(transformedEvents);
        } else {
          // No upcoming events found
          setUpcomingEvents([]);
        }
        setEventsLoaded(true);
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        // Fallback to demo data
        setUpcomingEvents([
          {
            title: "Underground Warehouse Rave",
            date: "Tomorrow",
            time: "8:00 PM",
            genre: "Techno",
          },
          {
            title: "Rooftop Summer Sessions",
            date: "Aug 20",
            time: "6:00 PM",
            genre: "House",
          },
          {
            title: "Club Residency Audition",
            date: "Aug 25",
            time: "9:00 PM",
            genre: "Drum & Bass",
          },
        ]);
        setEventsLoaded(true);
      }
    };

    fetchUpcomingEvents();
  }, []);

  // Update main loading state when all data is loaded
  useEffect(() => {
    if (statsLoaded && activityLoaded && eventsLoaded) {
      // Add a small delay for smooth transition
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  }, [statsLoaded, activityLoaded, eventsLoaded]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "application":
        return "📝";
      case "opportunity":
        return "🎯";
      case "member":
        return "👥";
      case "loading":
        return "⏳";
      case "error":
        return "❌";
      default:
        return "📌";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "application":
        return "bg-blue-100 text-blue-800";
      case "opportunity":
        return "bg-green-100 text-green-800";
      case "member":
        return "bg-orange-100 text-orange-800";
      case "loading":
        return "bg-gray-100 text-gray-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Skeleton component for stats cards
  const StatsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((index) => (
        <Card key={index} className="bg-card border-border">
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Skeleton component for activity cards
  const ActivitySkeleton = () => (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((index) => (
            <Card key={index} className="bg-card border-border">
              <CardContent className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Skeleton component for events cards
  const EventsSkeleton = () => (
    <Card className="bg-card border-border">
      <CardHeader className="pb-4">
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {[1, 2, 3].map((index) => (
            <Card key={index} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full ml-3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {isLoading ? (
        <>
          <StatsSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <ActivitySkeleton />
            <EventsSkeleton />
          </div>
        </>
      ) : (
        <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-blur-in">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className={textStyles.subheading.small}>
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div
                    className={`${textStyles.subheading.large} leading-none`}
                  >
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Activity and Upcoming Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Recent Activity */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle
                  className={`${textStyles.headline.section} text-left`}
                >
                  RECENT
                  <br />
                  ACTIVITY
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <Card key={index} className="bg-card border-border">
                      <CardContent className="p-4">
                        <div className="flex-1 min-w-0">
                          <p className={textStyles.body.regular}>
                            {activity.message}
                          </p>
                          <p className={`${textStyles.body.small} mt-2`}>
                            {activity.time}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle
                  className={`${textStyles.headline.section} text-left`}
                >
                  UPCOMING
                  <br />
                  EVENTS
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event, index) => (
                      <Card key={index} className="bg-card border-border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={textStyles.body.regular}>
                                {event.title}
                              </p>
                              <p className={`${textStyles.body.small} mt-2`}>
                                {event.date} - {event.time}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase ml-3"
                            >
                              {event.genre}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📅</div>
                      <p
                        className={`${textStyles.body.regular} text-muted-foreground`}
                      >
                        No upcoming events
                      </p>
                      <p
                        className={`${textStyles.body.small} text-muted-foreground mt-2`}
                      >
                        Create opportunities to see upcoming events here
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
