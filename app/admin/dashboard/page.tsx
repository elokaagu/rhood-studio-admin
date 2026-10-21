"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { textStyles } from "@/lib/typography";
import { getCurrentUserProfile, getCurrentUserId, type UserProfile } from "@/lib/auth-utils";
import { brandAccountId } from "@/lib/brand/account-scope";
import { BrandTeammateInviteDialog } from "@/components/admin/brands/BrandTeammateInviteDialog";
import {
  getDashboardData,
  type ActivityItem,
  type DashboardStat,
  type UpcomingEvent,
} from "@/lib/dashboard/get-dashboard-data";
import { DashboardEmptyVisual } from "@/components/admin/dashboard/DashboardEmptyVisual";

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      const [profile, userId] = await Promise.all([
        getCurrentUserProfile(),
        getCurrentUserId(),
      ]);

      const data = await getDashboardData({
        userId: brandAccountId(profile) || userId,
        role: profile?.role ?? null,
      });

      if (cancelled) return;
      setProfile(profile);
      setStats(data.stats);
      setRecentActivity(data.recentActivity);
      setUpcomingEvents(data.upcomingEvents);
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
          {profile?.role === "brand" && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className={`${textStyles.body.regular} text-sm text-muted-foreground`}>
                Invite a colleague to the same {profile.brand_name || "brand"} account.
              </p>
              <BrandTeammateInviteDialog
                brandAccountId={brandAccountId(profile) || profile.id}
                brandName={profile.brand_name || "your brand"}
              />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {stats.map((stat: DashboardStat) => (
              <Card key={stat.title} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className={textStyles.subheading.small}>{stat.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className={`${textStyles.subheading.large} leading-none`}>{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className={`${textStyles.headline.section} text-left`}>
                  RECENT
                  <br />
                  ACTIVITY
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity: ActivityItem) => (
                      <div
                        key={`${activity.type}:${activity.createdAt}:${activity.message}`}
                        className="relative pl-4 border-l border-brand-green/30 py-2"
                      >
                        <span className="absolute -left-[3px] top-3 h-1.5 w-1.5 rounded-full bg-brand-green" />
                        <p className={textStyles.body.regular}>{activity.message}</p>
                        <p className={`${textStyles.body.small} mt-1 text-muted-foreground`}>
                          {activity.time}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <DashboardEmptyVisual variant="activity" />
                    <p className={`${textStyles.body.regular} text-muted-foreground mt-4`}>
                      No recent activity
                    </p>
                    <p className={`${textStyles.body.small} text-muted-foreground mt-1`}>
                      Approvals, applications, and bookings will show up here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="pb-4">
                <CardTitle className={`${textStyles.headline.section} text-left`}>
                  UPCOMING
                  <br />
                  EVENTS
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingEvents.map((event: UpcomingEvent) => (
                      <div
                        key={`${event.title}:${event.date}:${event.time}`}
                        className="flex items-start justify-between gap-3 rounded-md border border-border/60 bg-secondary/30 px-3 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className={`${textStyles.body.regular} truncate`}>
                            {event.title}
                          </p>
                          <p className={`${textStyles.body.small} mt-1 text-muted-foreground`}>
                            {event.date} — {event.time}
                          </p>
                        </div>
                        {event.genre ? (
                          <Badge
                            variant="outline"
                            className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase shrink-0"
                          >
                            {event.genre}
                          </Badge>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <DashboardEmptyVisual variant="events" />
                    <p className={`${textStyles.body.regular} text-muted-foreground mt-4`}>
                      No upcoming events
                    </p>
                    <p className={`${textStyles.body.small} text-muted-foreground mt-1`}>
                      Create opportunities to see dates land here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
