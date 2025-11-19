"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  FileSpreadsheet,
  FileText,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { jsPDF } from "jspdf";

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

export default function AnalyticsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingCSV, setIsGeneratingCSV] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
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

      // Calculate minutes per user per day
      // Get all AI sessions from today with processing times
      const { data: aiSessions } = await supabase
        .from("ai_insights_sessions")
        .select("processing_time_ms, user_id")
        .gte("created_at", today.toISOString())
        .not("processing_time_ms", "is", null);

      // Get unique active users today from various activities
      const activeUserIds = new Set<string>();

      // Users with AI sessions today
      if (aiSessions) {
        aiSessions.forEach((session) => {
          if (session.user_id) {
            activeUserIds.add(session.user_id);
          }
        });
      }

      // Users who created applications today
      const { data: todayApplications } = await supabase
        .from("applications")
        .select("user_id")
        .gte("created_at", today.toISOString());
      if (todayApplications) {
        todayApplications.forEach((app) => {
          if (app.user_id) {
            activeUserIds.add(app.user_id);
          }
        });
      }

      // Users who uploaded mixes today
      const { data: todayMixes } = await supabase
        .from("mixes")
        .select("uploaded_by")
        .gte("created_at", today.toISOString());
      if (todayMixes) {
        todayMixes.forEach((mix) => {
          if (mix.uploaded_by) {
            activeUserIds.add(mix.uploaded_by);
          }
        });
      }

      // Users who sent messages today
      const { data: todayMessages } = await supabase
        .from("messages")
        .select("sender_id")
        .gte("created_at", today.toISOString());
      if (todayMessages) {
        todayMessages.forEach((msg) => {
          if (msg.sender_id) {
            activeUserIds.add(msg.sender_id);
          }
        });
      }

      // Users who updated their profile today
      const { data: todayProfileUpdates } = await supabase
        .from("user_profiles")
        .select("id")
        .gte("updated_at", today.toISOString());
      if (todayProfileUpdates) {
        todayProfileUpdates.forEach((profile) => {
          activeUserIds.add(profile.id);
        });
      }

      const activeUsersCount = activeUserIds.size;

      // Calculate total processing time from AI sessions (in milliseconds)
      let totalProcessingTimeMs = 0;
      if (aiSessions) {
        totalProcessingTimeMs = aiSessions.reduce(
          (sum, session) => sum + (session.processing_time_ms || 0),
          0
        );
      }

      // Estimate additional engagement time from other activities
      // Rough estimates: application = 2 min, mix upload = 5 min, message = 1 min, profile update = 1 min
      let estimatedAdditionalMinutes = 0;
      if (todayApplications) {
        estimatedAdditionalMinutes += todayApplications.length * 2;
      }
      if (todayMixes) {
        estimatedAdditionalMinutes += todayMixes.length * 5;
      }
      if (todayMessages) {
        estimatedAdditionalMinutes += todayMessages.length * 1;
      }
      if (todayProfileUpdates) {
        estimatedAdditionalMinutes += todayProfileUpdates.length * 1;
      }

      // Convert AI processing time from ms to minutes
      const aiProcessingMinutes = totalProcessingTimeMs / 1000 / 60;
      const totalEngagementMinutes = aiProcessingMinutes + estimatedAdditionalMinutes;

      // Calculate average minutes per user per day
      const avgMinutes =
        activeUsersCount > 0
          ? Math.round((totalEngagementMinutes / activeUsersCount) * 10) / 10
          : 0;

      setMinutesPerUser(avgMinutes);

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

  const hexToRgb = (hex: string): [number, number, number] => {
    const normalized = hex.replace("#", "");
    if (normalized.length !== 6) return [0, 0, 0];
    const bigint = parseInt(normalized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
  };

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
      link.setAttribute("download", `RHOOD_Analytics_${today}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "CSV Downloaded",
        description: "Analytics data has been downloaded successfully.",
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

  const downloadPDF = () => {
    try {
      setIsGeneratingPDF(true);

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const margin = 48;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const brandBlack = hexToRgb("#1D1D1B");
      const accentGreen = hexToRgb("#5F6604");
      const accentTint = hexToRgb("#EEF2C7");
      const textMuted = [92, 92, 92] as [number, number, number];

      const drawHeader = (subtitle: string) => {
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.setTextColor(...brandBlack);
        doc.text("R/HOOD Portal Analytics", margin, margin);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(...textMuted);
        doc.text(subtitle, margin, margin + 20);
        doc.setFillColor(...accentGreen);
        doc.rect(margin, margin + 28, pageWidth - margin * 2, 3, "F");
      };

      const ensureSpace = (
        docInstance: jsPDF,
        cursor: { y: number },
        required: number,
        subtitle: string
      ) => {
        if (cursor.y + required <= pageHeight - margin) return;
        docInstance.addPage();
        drawHeader(subtitle);
        cursor.y = margin + 70;
      };

      const cursor = { y: margin + 70 };
      const generatedAt = new Date().toLocaleString(undefined, {
        dateStyle: "long",
        timeStyle: "short",
      });
      drawHeader(`Generated ${generatedAt}`);

      // Key metrics grid
      const metrics = [
        { label: "Monthly Signups", value: currentMonthSignups },
        { label: "Brand Applications", value: brandApplications },
        { label: "Daily Active Users", value: dailyActiveUsers },
        { label: "Avg Minutes Per User", value: minutesPerUser },
      ];

      const columnGap = 24;
      const cardWidth = (pageWidth - margin * 2 - columnGap) / 2;
      const cardHeight = 72;

      doc.setLineWidth(1);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...brandBlack);
      doc.text("Key Metrics", margin, cursor.y);
      cursor.y += 24;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);

      metrics.forEach((metric, index) => {
        const row = Math.floor(index / 2);
        const col = index % 2;
        const x = margin + col * (cardWidth + columnGap);
        const y = cursor.y + row * (cardHeight + 12);

        doc.setFillColor(...accentTint);
        doc.roundedRect(x, y, cardWidth, cardHeight, 8, 8, "F");
        doc.setDrawColor(...accentGreen);
        doc.roundedRect(x, y, cardWidth, cardHeight, 8, 8, "S");

        doc.setTextColor(...textMuted);
        doc.text(metric.label.toUpperCase(), x + 16, y + 22);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.setTextColor(...brandBlack);
        doc.text(String(metric.value), x + 16, y + 48);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
      });

      cursor.y += Math.ceil(metrics.length / 2) * (cardHeight + 12) + 20;

      // Monthly signups table
      ensureSpace(doc, cursor, 200, `Generated ${generatedAt}`);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...brandBlack);
      doc.text("Monthly Signups (Last 6 Months)", margin, cursor.y);
      cursor.y += 18;

      const tableRowHeight = 26;
      const tableWidth = pageWidth - margin * 2;

      doc.setFillColor(...accentGreen);
      doc.rect(margin, cursor.y, tableWidth, tableRowHeight, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("Month", margin + 12, cursor.y + 17);
      doc.text("Signups", margin + tableWidth - 12, cursor.y + 17, {
        align: "right",
      });
      cursor.y += tableRowHeight;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      monthlySignups.forEach((entry, index) => {
        if (index % 2 === 0) {
          doc.setFillColor(...accentTint);
          doc.rect(margin, cursor.y, tableWidth, tableRowHeight, "F");
        }
        doc.setTextColor(...brandBlack);
        doc.text(entry.month, margin + 12, cursor.y + 17);
        doc.text(String(entry.signups), margin + tableWidth - 12, cursor.y + 17, {
          align: "right",
        });
        cursor.y += tableRowHeight;
      });

      cursor.y += 24;

      // Top locations list
      ensureSpace(doc, cursor, 200, `Generated ${generatedAt}`);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...brandBlack);
      doc.text("Top Locations", margin, cursor.y);
      cursor.y += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(...textMuted);
      const locations = countryData.slice(0, 10);
      if (locations.length === 0) {
        doc.text("No location data available.", margin, cursor.y + 12);
        cursor.y += 24;
      } else {
        locations.forEach((location, index) => {
          ensureSpace(doc, cursor, tableRowHeight + 10, `Generated ${generatedAt}`);
          doc.setTextColor(...brandBlack);
          doc.text(
            `${index + 1}. ${location.country}`,
            margin + 12,
            cursor.y + 16
          );
          doc.setTextColor(...textMuted);
          doc.text(
            `${location.count} members`,
            margin + tableWidth / 2,
            cursor.y + 16
          );
          cursor.y += tableRowHeight;
        });
      }

      // Engagement leaders page
      doc.addPage();
      drawHeader("Engagement & Ratings Overview");
      cursor.y = margin + 70;

      const userSections = [
        {
          title: "Most Active Users",
          subtitle: "Top members based on gig applications.",
          rows: topUsers.mostActive.map((user, index) => ({
            rank: index + 1,
            label: user.name,
            value: `${user.gigs} gigs`,
          })),
        },
        {
          title: "Highest Rated Users",
          subtitle: "Average feedback ratings from AI matching sessions.",
          rows: topUsers.highestRating.map((user, index) => ({
            rank: index + 1,
            label: user.name,
            value: `${user.rating.toFixed(1)} ★`,
          })),
        },
        {
          title: "Up and Coming",
          subtitle: "Members without gig history yet but active recently.",
          rows: topUsers.upAndComing.map((user, index) => ({
            rank: index + 1,
            label: user.name,
            value: "New",
          })),
        },
        {
          title: "Least Active Users",
          subtitle: "Members with minimal gig activity.",
          rows: topUsers.leastActive.map((user, index) => ({
            rank: index + 1,
            label: user.name,
            value: `${user.gigs} gigs`,
          })),
        },
      ];

      userSections.forEach((section) => {
        const requiredHeight =
          70 + Math.max(section.rows.length, 1) * (tableRowHeight + 4);
        ensureSpace(doc, cursor, requiredHeight, "Engagement & Ratings Overview");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(...brandBlack);
        doc.text(section.title, margin, cursor.y);
        cursor.y += 16;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(...textMuted);
        doc.text(section.subtitle, margin, cursor.y);
        cursor.y += 20;

        doc.setFillColor(...accentGreen);
        doc.rect(margin, cursor.y, tableWidth, tableRowHeight, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text("#", margin + 12, cursor.y + 17);
        doc.text("User", margin + 48, cursor.y + 17);
        doc.text("Metric", margin + tableWidth - 12, cursor.y + 17, {
          align: "right",
        });
        cursor.y += tableRowHeight;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        if (section.rows.length === 0) {
          doc.setFillColor(...accentTint);
          doc.rect(margin, cursor.y, tableWidth, tableRowHeight, "F");
          doc.setTextColor(...brandBlack);
          doc.text("No data available", margin + 12, cursor.y + 17);
          cursor.y += tableRowHeight + 16;
          return;
        }

        section.rows.forEach((row, index) => {
          ensureSpace(doc, cursor, tableRowHeight + 12, "Engagement & Ratings Overview");
          if (index % 2 === 0) {
            doc.setFillColor(...accentTint);
            doc.rect(margin, cursor.y, tableWidth, tableRowHeight, "F");
          }
          doc.setTextColor(...brandBlack);
          doc.text(String(row.rank), margin + 12, cursor.y + 17);
          doc.text(row.label, margin + 48, cursor.y + 17);
          doc.text(row.value, margin + tableWidth - 12, cursor.y + 17, {
            align: "right",
          });
          cursor.y += tableRowHeight;
        });

        cursor.y += 28;
      });

      const today = new Date().toISOString().split("T")[0];
      doc.save(`RHOOD_Analytics_${today}.pdf`);

      toast({
        title: "PDF Downloaded",
        description: "A styled analytics report has been generated successfully.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const isBusy = isGeneratingCSV || isGeneratingPDF;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white text-lg sm:text-xl md:text-2xl">
            ANALYTICS
          </h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base`}>
            Analytics and insights for R/HOOD
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="outline"
            className="border-brand-green text-brand-green hover:bg-brand-green/10 w-full sm:w-auto"
          >
            <a
              href="https://analytics.google.com/analytics/web/?authuser=3#/a375463949p513483059/realtime/overview?params=_u..nav%3Dmaui&collectionId=app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Detailed Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </a>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={isBusy}
                className="bg-brand-green hover:bg-brand-green/90 text-brand-black w-full sm:w-auto"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Preparing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Export Data</span>
                    <span className="sm:hidden">Export</span>
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px]">
              <DropdownMenuItem
                onSelect={() => {
                  if (!isGeneratingPDF) {
                    downloadCSV();
                  }
                }}
                disabled={isGeneratingCSV}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  if (!isGeneratingCSV) {
                    downloadPDF();
                  }
                }}
                disabled={isGeneratingPDF}
              >
                <FileText className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                  className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <Badge className="bg-brand-green text-brand-black text-xs flex-shrink-0">
                      #{index + 1}
                    </Badge>
                    <button
                      onClick={() => router.push(`/admin/members/${user.id}`)}
                      className={`${textStyles.body.regular} hover:text-brand-green transition-colors cursor-pointer truncate text-left`}
                    >
                      {user.name}
                    </button>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-brand-green text-brand-green bg-transparent flex-shrink-0 text-xs"
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
                  className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50"
                >
                  <button
                    onClick={() => router.push(`/admin/members/${user.id}`)}
                    className={`${textStyles.body.regular} hover:text-brand-green transition-colors cursor-pointer truncate text-left text-xs sm:text-sm min-w-0 flex-1`}
                  >
                    {user.name}
                  </button>
                  <Badge
                    variant="outline"
                    className="border-brand-green text-brand-green bg-transparent flex-shrink-0 text-xs"
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
                  className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50"
                >
                  <button
                    onClick={() => router.push(`/admin/members/${user.id}`)}
                    className={`${textStyles.body.regular} hover:text-brand-green transition-colors cursor-pointer truncate text-left text-xs sm:text-sm min-w-0 flex-1`}
                  >
                    {user.name}
                  </button>
                  <Badge
                    variant="outline"
                    className="border-gray-400 text-gray-400 bg-transparent flex-shrink-0 text-xs"
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
