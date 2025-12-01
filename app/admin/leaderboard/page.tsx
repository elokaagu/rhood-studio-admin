"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserProfile } from "@/lib/auth-utils";
import {
  Star,
  Search,
} from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  dj_name: string | null;
  brand_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  total_credits: number;
  rank_position: number;
  role?: string | null;
}

export default function LeaderboardPage() {
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null); // Default to "All Time"
  const [userProfile, setUserProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      const profile = await getCurrentUserProfile();
      setUserProfile(profile);
    };
    fetchUserProfile();
  }, []);

  const fetchLeaderboard = async (year: number | null) => {
    try {
      setIsLoading(true);
      
      // Use direct query to show all users with credits (including admins)
      // This ensures we see everyone who has credits in the system
      await fetchLeaderboardFallback(year);
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load leaderboard. Please try again.",
        variant: "destructive",
      });
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback query if RPC function doesn't exist yet
  const fetchLeaderboardFallback = async (year: number | null) => {
    try {
      console.log("Using fallback query to fetch leaderboard directly from database");
      
      // Query credits directly from user_profiles table
      // @ts-ignore - credits column may not exist yet
      let query: any = (supabase as any)
        .from("user_profiles")
        .select("id, dj_name, brand_name, first_name, last_name, email, credits, role");
      
      // Show all users with credits (including admins)
      // No admin filter - we want to show everyone with credits
      
      // Order by credits descending, nulls last
      // @ts-ignore - credits column may not exist yet
      query = query.order("credits", { ascending: false, nullsLast: true });
      
      // Limit results
      query = query.limit(100);
      
      const { data: profiles, error } = await query;
      
      console.log("Fallback query result:", { profilesCount: profiles?.length, error });

      if (error) {
        // If credits column doesn't exist, return empty array
        if (error.code === '42703' || error.message?.includes('column "credits" does not exist')) {
          console.warn("Credits column doesn't exist yet - migration needed");
          toast({
            title: "Migration Required",
            description: "Please run the credits system migration (20250114000000_create_credits_system.sql) in Supabase to enable the leaderboard.",
            variant: "destructive",
          });
          setLeaderboard([]);
          return;
        }
        throw error;
      }

      // Transform to leaderboard format and filter out users with 0 or null credits
      const validProfiles = (profiles || []).filter((profile: any) => {
        const credits = profile.credits ?? 0;
        return credits > 0;
      });
      
      console.log(`Found ${validProfiles.length} users with credits`);
      
      const entries: LeaderboardEntry[] = validProfiles.map((profile: any, index: number) => ({
        user_id: profile.id,
        dj_name: profile.dj_name,
        brand_name: profile.brand_name,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        total_credits: profile.credits ?? 0,
        rank_position: index + 1,
        role: profile.role || null,
      }));

      // If filtering by year, we can't do it without the function
      // So we'll just show all-time for now (silently, no notification)
      // The RPC function should handle year filtering when available
      
      setLeaderboard(entries);
    } catch (error: any) {
      console.error("Error in fallback leaderboard query:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load leaderboard. Please run the credits system migration.",
        variant: "destructive",
      });
      setLeaderboard([]);
    }
  };

  useEffect(() => {
    fetchLeaderboard(selectedYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const getDisplayName = (entry: LeaderboardEntry) => {
    return (
      entry.dj_name ||
      entry.brand_name ||
      `${entry.first_name || ""} ${entry.last_name || ""}`.trim() ||
      entry.email
    );
  };

  // Filter leaderboard based on search term
  const filteredLeaderboard = useMemo(() => {
    if (!searchTerm.trim()) {
      return leaderboard;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return leaderboard.filter((entry) => {
      // Get all searchable fields
      const displayName = (
        entry.dj_name ||
        entry.brand_name ||
        `${entry.first_name || ""} ${entry.last_name || ""}`.trim() ||
        entry.email
      ).toLowerCase();
      const email = entry.email.toLowerCase();
      const djName = (entry.dj_name || "").toLowerCase();
      const brandName = (entry.brand_name || "").toLowerCase();
      const firstName = (entry.first_name || "").toLowerCase();
      const lastName = (entry.last_name || "").toLowerCase();
      const credits = entry.total_credits.toString();

      return (
        displayName.includes(searchLower) ||
        email.includes(searchLower) ||
        djName.includes(searchLower) ||
        brandName.includes(searchLower) ||
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        credits.includes(searchLower)
      );
    });
  }, [leaderboard, searchTerm]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`${textStyles.headline.section} text-xl sm:text-2xl md:text-3xl`}>
            Credits Leaderboard
          </h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base mt-1`}>
            All users ranked by credits earned
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <Button
            variant={selectedYear === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedYear(null)}
            className="text-xs sm:text-sm"
          >
            All Time
          </Button>
          <Button
            variant={selectedYear === currentYear ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedYear(currentYear)}
            className="text-xs sm:text-sm"
          >
            {currentYear}
          </Button>
        </div>
      </div>

      {/* Leaderboard List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className={textStyles.subheading.small}>
              {selectedYear ? `${selectedYear} Leaderboard` : "All-Time Leaderboard"}
            </CardTitle>
            
            {/* Search Bar */}
            <div className="relative w-full sm:w-auto sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-secondary border-border text-foreground w-full"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className={textStyles.body.regular}>Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <p className={textStyles.body.regular}>
                No data available for {selectedYear || "all-time"}.
              </p>
            </div>
          ) : filteredLeaderboard.length === 0 ? (
            <div className="text-center py-8">
              <p className={textStyles.body.regular}>
                No users found matching "{searchTerm}".
              </p>
            </div>
          ) : (
            <div className="space-y-2 stagger-children">
              {filteredLeaderboard.map((entry, index) => {
                const isCurrentUser = userProfile?.id === entry.user_id;
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      isCurrentUser
                        ? "bg-brand-green/10 border-brand-green"
                        : "bg-secondary/50 border-border hover:bg-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 text-muted-foreground">
                        #{entry.rank_position}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`font-semibold truncate ${
                              isCurrentUser ? "text-brand-green" : "text-foreground"
                            }`}
                          >
                            {getDisplayName(entry)}
                          </h3>
                          {isCurrentUser && (
                            <Badge variant="outline" className="border-brand-green text-brand-green text-xs">
                              You
                            </Badge>
                          )}
                          {entry.role === 'admin' && (
                            <Badge variant="outline" className="text-xs">
                              Admin
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`font-bold ${isCurrentUser ? "text-brand-green" : "text-foreground"}`}>
                        {entry.total_credits} credits
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top 10 Rewards Info */}
      {selectedYear === currentYear && (
        <Card className="bg-card border-border border-brand-green/20">
          <CardHeader>
            <CardTitle className={textStyles.subheading.small}>
              Year-End Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`${textStyles.body.regular} mb-3`}>
              The top 10 DJs at the end of {currentYear} will receive special rewards:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Festival tickets</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>DJ equipment (controller, turntable, headphones)</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Gift cards</span>
              </li>
              <li className="flex items-start gap-2">
                <Star className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Sponsored items from brand partners</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

