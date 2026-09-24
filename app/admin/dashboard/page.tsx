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
            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className={`${textStyles.headline.section} text-left`}>
                  RECENT
                  <br />
                  ACTIVITY
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {recentActivity.map((activity: ActivityItem) => (
                    <Card
                      key={`${activity.type}:${activity.createdAt}:${activity.message}`}
                      className="bg-card border-border"
                    >
                      <CardContent className="p-4">
                        <div className="flex-1 min-w-0">
                          <p className={textStyles.body.regular}>{activity.message}</p>
                          <p className={`${textStyles.body.small} mt-2`}>{activity.time}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-4">
                <CardTitle className={`${textStyles.headline.section} text-left`}>
                  UPCOMING
                  <br />
                  EVENTS
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event: UpcomingEvent) => (
                      <Card
                        key={`${event.title}:${event.date}:${event.time}`}
                        className="bg-card border-border"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={textStyles.body.regular}>{event.title}</p>
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
                      <p className={`${textStyles.body.regular} text-muted-foreground`}>
                        No upcoming events
                      </p>
                      <p className={`${textStyles.body.small} text-muted-foreground mt-2`}>
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
