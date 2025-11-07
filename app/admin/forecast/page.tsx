"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/lib/typography";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Globe,
  Calendar,
  Clock,
  Award,
  Zap,
  Star,
  ArrowUp,
  Activity,
  Briefcase,
  Download,
} from "lucide-react";

interface MonthlyData {
  monthKey: string;
  month: string;
  signups: number;
  applications: number;
}

interface CountryData {
  country: string;
  count: number;
}

interface AgeData {
  ageRange: string;
  count: number;
}

interface TopUser {
  id: string;
  name: string;
  rating: number;
  gigs: number;
  status: string;
}

export default function ForecastPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingCSV, setIsGeneratingCSV] = useState(false);
  const [monthlySignups, setMonthlySignups] = useState<MonthlyData[]>([]);
  const [currentMonthSignups, setCurrentMonthSignups] = useState(0);
  const [brandApplications, setBrandApplications] = useState(0);
  const [countryData, setCountryData] = useState<CountryData[]>([]);
  const [ageData, setAgeData] = useState<AgeData[]>([]);
  const [dailyActiveUsers, setDailyActiveUsers] = useState(0);
  const [minutesPerUser, setMinutesPerUser] = useState(0);
  const [topUsers, setTopUsers] = useState({
    mostActive: [] as TopUser[],
    highestRating: [] as TopUser[],
    upAndComing: [] as TopUser[],
    leastActive: [] as TopUser[],
  });

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);

      // Fetch monthly signups
      const { data: membersData } = await supabase
        .from("user_profiles")
        .select("created_at")
        .order("created_at", { ascending: false });

      if (membersData) {
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

        const monthlyMap = new Map<
          string,
          { count: number; sortOrder: number }
        >();
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}`;

        membersData.forEach((member) => {
          if (!member.created_at) return;
          const date = new Date(member.created_at);
          const monthKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;
          const sortOrder = new Date(
            date.getFullYear(),
            date.getMonth(),
            1
          ).getTime();

          if (!monthlyMap.has(monthKey)) {
            monthlyMap.set(monthKey, { count: 0, sortOrder });
          }

          monthlyMap.get(monthKey)!.count += 1;
        });

        // Ensure current month is present even if zero
        if (!monthlyMap.has(currentMonthKey)) {
          const currentSortOrder = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          ).getTime();
          monthlyMap.set(currentMonthKey, { count: 0, sortOrder: currentSortOrder });
        }

        const monthlyArray = Array.from(monthlyMap.entries())
          .map(([monthKey, { count, sortOrder }]) => {
            const [yearStr, monthStr] = monthKey.split("-");
            const year = parseInt(yearStr, 10);
            const monthIndex = parseInt(monthStr, 10) - 1;
            const label = `${monthNames[monthIndex]} ${year}`;

            return {
              monthKey,
              month: label,
              signups: count,
              applications: 0,
              sortOrder,
            };
          })
          .sort((a, b) => a.sortOrder - b.sortOrder);

        const trimmedMonthlyArray = monthlyArray.slice(-6);
        setMonthlySignups(
          trimmedMonthlyArray.map(({ sortOrder, ...rest }) => rest)
        );

        const currentMonthEntry = monthlyArray.find(
          (entry) => entry.monthKey === currentMonthKey
        );
        setCurrentMonthSignups(currentMonthEntry?.signups ?? 0);
      }

      // Fetch brand applications (opportunities created)
      const { count: opportunitiesCount } = await supabase
        .from("opportunities")
        .select("*", { count: "exact", head: true });
      setBrandApplications(opportunitiesCount || 0);

      // Fetch country data
      const { data: profilesData } = await supabase
        .from("user_profiles")
        .select("city");

      if (profilesData) {
        const countryMap = new Map<string, number>();
        profilesData.forEach((profile) => {
          // Parse city for country information (assuming format like "London, UK" or "San Francisco, US")
          const city = profile.city || "Unknown";
          countryMap.set(city, (countryMap.get(city) || 0) + 1);
        });
        const countryArray = Array.from(countryMap.entries())
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        setCountryData(countryArray);
      }

      // Fetch age data (placeholder - would need birthday field)
      setAgeData([
        { ageRange: "18-25", count: 0 },
        { ageRange: "26-35", count: 0 },
        { ageRange: "36-45", count: 0 },
        { ageRange: "46+", count: 0 },
      ]);

      // Fetch daily active users
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: dailyActive } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true })
        .gte("updated_at", today.toISOString());
      setDailyActiveUsers(dailyActive || 0);

      // Calculate minutes per user (placeholder)
      setMinutesPerUser(0);

      // Fetch top users
      const { data: allMembers } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, dj_name, city");

      if (allMembers) {
        const usersWithStats = await Promise.all(
          allMembers.map(async (member) => {
            // Get rating
            let rating = 0;
            const { data: feedback } = await supabase
              .from("ai_matching_feedback")
              .select("rating")
              .eq("user_id", member.id);
            if (feedback && feedback.length > 0) {
              rating =
                feedback.reduce((sum, f) => sum + (f.rating || 0), 0) /
                feedback.length;
            }

            // Get gigs count
            const { count: gigsCount } = await supabase
              .from("applications")
              .select("*", { count: "exact", head: true })
              .eq("user_id", member.id);

            return {
              id: member.id,
              name:
                member.dj_name || `${member.first_name} ${member.last_name}`,
              rating,
              gigs: gigsCount || 0,
              status:
                rating > 3 ? "active" : rating > 1 ? "upcoming" : "inactive",
            };
          })
        );

        const sortedByGigs = [...usersWithStats].sort(
          (a, b) => b.gigs - a.gigs
        );
        const sortedByRating = [...usersWithStats].sort(
          (a, b) => b.rating - a.rating
        );
        const sortedByRecent = [...usersWithStats].filter((u) => u.gigs === 0);

        setTopUsers({
          mostActive: sortedByGigs.slice(0, 5),
          highestRating: sortedByRating.slice(0, 5),
          upAndComing: sortedByRecent.slice(0, 5),
          leastActive: sortedByGigs.slice(-5).reverse(),
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className={textStyles.body.regular}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const downloadCSV = () => {
    try {
      setIsGeneratingCSV(true);

      const rows: string[][] = [];
      const escape = (value: string): string =>
        `"${value.replace(/"/g, '""')}"`;

      const addRow = (...values: (string | number)[]) =>
        rows.push(values.map((value) => String(value ?? "")));
      const addBlankRow = () => rows.push([]);

      // Overview metrics
      addRow("Overview", "Brand Applications", brandApplications);
      addRow("Overview", "Daily Active Users", dailyActiveUsers);
      addRow("Overview", "Average Minutes Per User", minutesPerUser);
      addBlankRow();

      // Monthly signups
      addRow("Monthly Signups", "Month", "Signups");
      monthlySignups.forEach((data) =>
        addRow("Monthly Signups", data.month, data.signups)
      );
      addBlankRow();

      // Top locations
      addRow("Top Locations", "Location", "Members");
      countryData.forEach((data) =>
        addRow("Top Locations", data.country, data.count)
      );
      addBlankRow();

      // Age data
      addRow("Age Distribution", "Age Range", "Members");
      ageData.forEach((data) =>
        addRow("Age Distribution", data.ageRange, data.count)
      );
      addBlankRow();

      // Top users sections
      const userSections = [
        {
          title: "Most Active Users",
          data: topUsers.mostActive,
          valueLabel: "Gigs",
          valueFormatter: (user: TopUser) => `${user.gigs}`,
        },
        {
          title: "Highest Rated Users",
          data: topUsers.highestRating,
          valueLabel: "Rating",
          valueFormatter: (user: TopUser) => user.rating.toFixed(1),
        },
        {
          title: "Up and Coming Users",
          data: topUsers.upAndComing,
          valueLabel: "Status",
          valueFormatter: () => "New",
        },
        {
          title: "Least Active Users",
          data: topUsers.leastActive,
          valueLabel: "Gigs",
          valueFormatter: (user: TopUser) => `${user.gigs}`,
        },
      ];

      userSections.forEach(({ title, data, valueLabel, valueFormatter }) => {
        addRow(title, "User", valueLabel);
        data.forEach((user, index) =>
          addRow(
            title,
            `${index + 1}. ${user.name}`,
            valueFormatter(user as TopUser)
          )
        );
        addBlankRow();
      });

      const csvContent = rows
        .map((row) =>
          row.length === 0
            ? ""
            : row.map((value) => escape(value)).join(",")
        )
        .join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const today = new Date().toISOString().split("T")[0];
      link.href = url;
      link.setAttribute("download", `RHOOD_Forecast_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "CSV Downloaded",
        description: "Forecast analytics have been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast({
        title: "CSV Generation Failed",
        description: "Failed to generate CSV. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCSV(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
            FORECAST
          </h1>
          <p className={textStyles.body.regular}>
            Analytics and insights for R/HOOD
          </p>
        </div>
        <Button
          onClick={downloadCSV}
          disabled={isGeneratingCSV}
          className="bg-brand-green hover:bg-brand-green/90 text-brand-black"
        >
          {isGeneratingCSV ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-black mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </>
          )}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Signups</p>
                <p className="text-2xl font-bold text-foreground">
                  {currentMonthSignups}
                </p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Brand Applications
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {brandApplications}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Total</p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Daily Active Users
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {dailyActiveUsers}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Today</p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Activity className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Avg Minutes/User
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {minutesPerUser}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Per day</p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Signups Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className={textStyles.subheading.small}>
              Monthly Sign Ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlySignups.map((data) => (
                <div
                  key={data.month}
                  className="flex items-center justify-between"
                >
                  <span className={textStyles.body.regular}>{data.month}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-muted rounded-full h-2">
                      <div
                        className="bg-brand-green h-2 rounded-full"
                        style={{
                          width: `${
                            (data.signups /
                              Math.max(
                                ...monthlySignups.map((m) => m.signups)
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className={textStyles.subheading.small}>
                      {data.signups}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className={textStyles.subheading.small}>
              Top Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {countryData.slice(0, 5).map((data, index) => (
                <div
                  key={data.country}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className="border-brand-green text-brand-green bg-transparent text-xs"
                    >
                      #{index + 1}
                    </Badge>
                    <span className={textStyles.body.regular}>
                      {data.country}
                    </span>
                  </div>
                  <span className={textStyles.subheading.small}>
                    {data.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Active */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className={textStyles.subheading.small}>
              Most Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topUsers.mostActive.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-brand-green text-brand-black text-xs">
                      #{index + 1}
                    </Badge>
                    <button
                      onClick={() => router.push(`/admin/members/${user.id}`)}
                      className={`${textStyles.body.regular} hover:text-brand-green transition-colors cursor-pointer`}
                    >
                      {user.name}
                    </button>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-brand-green text-brand-green bg-transparent"
                  >
                    {user.gigs} gigs
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Highest Rating */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className={textStyles.subheading.small}>
              Highest Rated Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topUsers.highestRating.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-2">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <button
                      onClick={() => router.push(`/admin/members/${user.id}`)}
                      className={`${textStyles.body.regular} hover:text-brand-green transition-colors cursor-pointer`}
                    >
                      {user.name}
                    </button>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-400">
                    {user.rating.toFixed(1)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Up and Coming */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className={textStyles.subheading.small}>
              Up and Coming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topUsers.upAndComing.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <button
                    onClick={() => router.push(`/admin/members/${user.id}`)}
                    className={`${textStyles.body.regular} hover:text-brand-green transition-colors cursor-pointer`}
                  >
                    {user.name}
                  </button>
                  <Badge
                    variant="outline"
                    className="border-brand-green text-brand-green bg-transparent"
                  >
                    <ArrowUp className="h-3 w-3 mr-1" />
                    New
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Least Active */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className={textStyles.subheading.small}>
              Least Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topUsers.leastActive.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                >
                  <button
                    onClick={() => router.push(`/admin/members/${user.id}`)}
                    className={`${textStyles.body.regular} hover:text-brand-green transition-colors cursor-pointer`}
                  >
                    {user.name}
                  </button>
                  <Badge
                    variant="outline"
                    className="border-gray-400 text-gray-400 bg-transparent"
                  >
                    {user.gigs} gigs
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
