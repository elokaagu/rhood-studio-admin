"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { textStyles } from "@/lib/typography";
import { formatDateShort } from "@/lib/date-utils";
import { supabase } from "@/integrations/supabase/client";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [activityLoaded, setActivityLoaded] = useState(false);

  const [stats, setStats] = useState([
    {
      title: "Active Opportunities",
      value: "0",
      change: "Loading...",
    },
    {
      title: "Pending Applications",
      value: "0",
      change: "Loading...",
    },
    {
      title: "Total Members",
      value: "0",
      change: "Loading...",
    },
    {
      title: "AI Matching Sessions",
      value: "0",
      change: "Loading...",
    },
  ]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch opportunities count
        const { count: opportunitiesCount } = await supabase
          .from("opportunities")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        // Fetch applications count
        const { count: applicationsCount } = await supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // Fetch user profiles count
        const { count: membersCount } = await supabase
          .from("user_profiles")
          .select("*", { count: "exact", head: true });

        // Fetch AI matching sessions count
        const { count: aiSessionsCount } = await supabase
          .from("ai_matching_sessions")
          .select("*", { count: "exact", head: true });

        setStats([
          {
            title: "Active Opportunities",
            value: opportunitiesCount?.toString() || "0",
            change: "Live data",
          },
          {
            title: "Pending Applications",
            value: applicationsCount?.toString() || "0",
            change: "Live data",
          },
          {
            title: "Total Members",
            value: membersCount?.toString() || "0",
            change: "Live data",
          },
          {
            title: "AI Matching Sessions",
            value: aiSessionsCount?.toString() || "0",
            change: "Live data",
          },
        ]);
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
        // Fetch recent applications
        const { data: recentApplications } = await supabase
          .from("applications")
          .select(
            `
            id,
            created_at,
            status,
            opportunities!inner(title),
            user_profiles!inner(dj_name)
          `
          )
          .order("created_at", { ascending: false })
          .limit(3);

        // Fetch recent opportunities
        const { data: recentOpportunities } = await supabase
          .from("opportunities")
          .select("id, title, created_at")
          .order("created_at", { ascending: false })
          .limit(2);

        // Fetch recent user registrations
        const { data: recentUsers } = await supabase
          .from("user_profiles")
          .select("id, dj_name, created_at")
          .order("created_at", { ascending: false })
          .limit(2);

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
        // Fetch opportunities with event dates in the future
        const { data: opportunities, error } = await supabase
          .from("opportunities")
          .select("title, event_date, genre, location")
          .eq("is_active", true)
          .not("event_date", "is", null)
          .gte("event_date", new Date().toISOString())
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
    <div className="space-y-8">
      {isLoading ? (
        <>
          <StatsSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ActivitySkeleton />
            <EventsSkeleton />
          </div>
        </>
      ) : (
        <div className="animate-in fade-in-0 duration-500 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className={textStyles.subheading.small}>
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className={textStyles.subheading.large}>
                    {stat.value}
                  </div>
                  <p className={`${textStyles.body.small} mt-2`}>
                    {stat.change}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Activity and Upcoming Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
