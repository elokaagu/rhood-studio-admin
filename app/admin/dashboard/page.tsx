"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { textStyles } from "@/lib/typography";
import { supabase } from "@/integrations/supabase/client";

export default function DashboardPage() {
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
      } catch (error) {
        console.error("Error fetching stats:", error);
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

  const [upcomingEvents, setUpcomingEvents] = useState([
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
              time: new Date(app.created_at).toLocaleDateString(),
            });
          });
        }

        // Add recent opportunities
        if (recentOpportunities) {
          recentOpportunities.forEach((opp: any) => {
            activities.push({
              type: "opportunity",
              message: `New opportunity posted: ${opp.title}`,
              time: new Date(opp.created_at).toLocaleDateString(),
            });
          });
        }

        // Add recent users
        if (recentUsers) {
          recentUsers.forEach((user: any) => {
            activities.push({
              type: "member",
              message: `${user.dj_name} joined the platform`,
              time: new Date(user.created_at).toLocaleDateString(),
            });
          });
        }

        // Sort by date and take top 4
        activities.sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
        );
        setRecentActivity(activities.slice(0, 4));
      } catch (error) {
        console.error("Error fetching recent activity:", error);
        setRecentActivity([
          {
            type: "error",
            message: "Failed to load recent activity",
            time: "",
          },
        ]);
      }
    };

    fetchRecentActivity();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className={textStyles.subheading.small}>
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={textStyles.subheading.large}>{stat.value}</div>
              <p className={`${textStyles.body.small} mt-1`}>{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity and Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className={`${textStyles.headline.section} text-left`}>
              RECENT
              <br />
              ACTIVITY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <Card key={index} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex-1 min-w-0">
                      <p className={textStyles.body.regular}>
                        {activity.message}
                      </p>
                      <p className={`${textStyles.body.small} mt-1`}>
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
          <CardHeader>
            <CardTitle className={`${textStyles.headline.section} text-left`}>
              UPCOMING
              <br />
              EVENTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.map((event, index) => (
                <Card key={index} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={textStyles.body.regular}>{event.title}</p>
                        <p className={`${textStyles.body.small} mt-1`}>
                          {event.date} - {event.time}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase"
                      >
                        {event.genre}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
