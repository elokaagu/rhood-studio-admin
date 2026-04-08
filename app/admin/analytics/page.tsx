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
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  Clock,
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
import { fetchAnalyticsDashboardData } from "@/lib/analytics/fetch-dashboard";
import { buildAnalyticsCsv } from "@/lib/analytics/export-csv";
import { buildAnalyticsPdf } from "@/lib/analytics/export-pdf";
import type { AnalyticsDashboardData } from "@/lib/analytics/types";

export default function AnalyticsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingCSV, setIsGeneratingCSV] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsDashboardData | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true);
        const data = await fetchAnalyticsDashboardData();
        setAnalytics(data);
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

    loadAnalytics();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="mx-auto w-full max-w-md space-y-3">
            <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
            <div className="h-20 w-full animate-pulse rounded-md bg-muted/70" />
            <div className="h-20 w-full animate-pulse rounded-md bg-muted/50" />
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className={textStyles.body.regular}>No analytics data available.</p>
        </div>
      </div>
    );
  }

  const downloadCSV = () => {
    try {
      setIsGeneratingCSV(true);

      const csvContent = buildAnalyticsCsv(analytics);

      const blob = new Blob(["\uFEFF" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const today = new Date().toISOString().split("T")[0];
      link.href = url;
      link.setAttribute("download", `R-HOOD_Analytics_${today}.csv`);
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

      const doc = buildAnalyticsPdf(analytics);

      const today = new Date().toISOString().split("T")[0];
      doc.save(`R-HOOD_Analytics_${today}.pdf`);

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
  const maxMonthlySignups = Math.max(
    ...analytics.monthlySignups.map((item) => item.signups),
    1
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-blur-in">
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
                  {analytics.currentMonthSignups}
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
                  {analytics.brandApplications}
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
                  {analytics.dailyActiveUsers}
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
                  {analytics.minutesPerUser}
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
              {analytics.monthlySignups.map((data) => (
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
                            (data.signups / maxMonthlySignups) * 100
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
              {analytics.locationData.slice(0, 5).map((data, index) => (
                <div
                  key={data.location}
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
                      {data.location}
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
              {analytics.topUsers.mostActive.map((user, index) => (
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
              {analytics.topUsers.highestRating.map((user, index) => (
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
              {analytics.topUsers.upAndComing.map((user) => (
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
              {analytics.topUsers.leastActive.map((user) => (
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
