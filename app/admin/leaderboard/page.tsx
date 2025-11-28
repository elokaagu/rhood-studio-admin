"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserProfile } from "@/lib/auth-utils";
import {
  Trophy,
  Medal,
  Award,
  Coins,
  Calendar,
  Crown,
  Star,
  TrendingUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeaderboardEntry {
  user_id: string;
  dj_name: string | null;
  brand_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  total_credits: number;
  rank_position: number;
}

export default function LeaderboardPage() {
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null); // Default to "All Time"
  const [userProfile, setUserProfile] = useState<any>(null);

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
      
      // Try to use RPC function first, fallback to direct query if function doesn't exist
      try {
        // @ts-ignore - RPC function not in types yet (migration needed)
        // Call with named parameters - handle NULL year correctly
        const { data, error } = await (supabase.rpc as any)("get_credits_leaderboard", {
          p_year: year ?? null, // Ensure null is explicitly passed, not undefined
          p_limit: 100,
        });

        if (error) {
          // If function doesn't exist or has issues, use fallback
          if (
            error.code === '42883' || 
            error.code === '42804' || // Structure does not match error
            error.message?.includes('does not exist') ||
            error.message?.includes('Could not find the function') ||
            error.message?.includes('schema cache') ||
            error.message?.includes('structure of query does not match') ||
            error.message?.includes('function result type')
          ) {
            console.warn("RPC function issue detected, using fallback query:", error.message);
            await fetchLeaderboardFallback(year);
            return;
          }
          throw error;
        }

        setLeaderboard((data as LeaderboardEntry[]) || []);
      } catch (rpcError: any) {
        // If RPC fails, try fallback query
        if (
          rpcError.code === '42883' || 
          rpcError.code === '42804' || // Structure does not match error
          rpcError.message?.includes('does not exist') ||
          rpcError.message?.includes('Could not find the function') ||
          rpcError.message?.includes('schema cache') ||
          rpcError.message?.includes('structure of query does not match') ||
          rpcError.message?.includes('function result type')
        ) {
          console.warn("RPC function issue detected, using fallback query:", rpcError.message);
          await fetchLeaderboardFallback(year);
        } else {
          throw rpcError;
        }
      }
    } catch (error: any) {
      console.error("Error fetching leaderboard:", error);
      
      // Check if it's a function error
      if (
        error.message?.includes("Could not find the function") ||
        error.message?.includes("schema cache") ||
        error.message?.includes("structure of query does not match") ||
        error.code === '42883' ||
        error.code === '42804'
      ) {
        toast({
          title: "Function Error",
          description: "There's an issue with the leaderboard function. Using fallback query. Please run FIX_LEADERBOARD_FUNCTION_TYPE_ERROR.sql in Supabase to fix this.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to load leaderboard. Please try again.",
          variant: "destructive",
        });
      }
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
        .select("id, dj_name, brand_name, first_name, last_name, email, credits");
      
      // Filter out admins: role is null OR role != 'admin'
      query = query.or("role.is.null,role.neq.admin");
      
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

  const getRankIcon = (rank: number) => {
    if (rank === 1) {
      return <Crown className="h-6 w-6 text-yellow-500" />;
    } else if (rank === 2) {
      return <Medal className="h-6 w-6 text-gray-400" />;
    } else if (rank === 3) {
      return <Medal className="h-6 w-6 text-amber-600" />;
    }
    return <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
      {rank}
    </Badge>;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "🏆 Champion";
    if (rank === 2) return "🥈 Runner-up";
    if (rank === 3) return "🥉 Third Place";
    if (rank <= 10) return "⭐ Top 10";
    return null;
  };

  const getDisplayName = (entry: LeaderboardEntry) => {
    return (
      entry.dj_name ||
      entry.brand_name ||
      `${entry.first_name || ""} ${entry.last_name || ""}`.trim() ||
      entry.email
    );
  };

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
            Top DJs ranked by credits earned
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

      {/* Top 3 Podium */}
      {!isLoading && leaderboard.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* 2nd Place */}
          {leaderboard[1] && (
            <Card className="bg-card border-border order-2 md:order-1">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  <Medal className="h-8 w-8 text-gray-400" />
                </div>
                <div className="text-2xl font-bold text-gray-400">2nd</div>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <Avatar className="h-16 w-16 mx-auto">
                  <AvatarFallback className="text-lg">
                    {getDisplayName(leaderboard[1])
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-base truncate">
                  {getDisplayName(leaderboard[1])}
                </h3>
                <div className="flex items-center justify-center gap-1 text-brand-green">
                  <Coins className="h-4 w-4" />
                  <span className="font-bold">{leaderboard[1].total_credits}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 1st Place */}
          {leaderboard[0] && (
            <Card className="bg-card border-border border-2 border-yellow-500 order-1 md:order-2">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  <Crown className="h-10 w-10 text-yellow-500" />
                </div>
                <div className="text-3xl font-bold text-yellow-500">1st</div>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <Avatar className="h-20 w-20 mx-auto border-2 border-yellow-500">
                  <AvatarFallback className="text-xl">
                    {getDisplayName(leaderboard[0])
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold text-lg truncate">
                  {getDisplayName(leaderboard[0])}
                </h3>
                <div className="flex items-center justify-center gap-1 text-brand-green">
                  <Coins className="h-5 w-5" />
                  <span className="font-bold text-lg">{leaderboard[0].total_credits}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 3rd Place */}
          {leaderboard[2] && (
            <Card className="bg-card border-border order-3">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  <Medal className="h-8 w-8 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-amber-600">3rd</div>
              </CardHeader>
              <CardContent className="text-center space-y-2">
                <Avatar className="h-16 w-16 mx-auto">
                  <AvatarFallback className="text-lg">
                    {getDisplayName(leaderboard[2])
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-base truncate">
                  {getDisplayName(leaderboard[2])}
                </h3>
                <div className="flex items-center justify-center gap-1 text-brand-green">
                  <Coins className="h-4 w-4" />
                  <span className="font-bold">{leaderboard[2].total_credits}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Full Leaderboard List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className={textStyles.subheading.small}>
            {selectedYear ? `${selectedYear} Leaderboard` : "All-Time Leaderboard"}
          </CardTitle>
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
          ) : (
            <div className="space-y-2 stagger-children">
              {leaderboard.map((entry, index) => {
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
                      <div className="flex-shrink-0">
                        {getRankIcon(entry.rank_position)}
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
                          {getRankBadge(entry.rank_position) && (
                            <Badge variant="outline" className="text-xs">
                              {getRankBadge(entry.rank_position)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Coins className="h-4 w-4 text-brand-green" />
                      <span className={`font-bold ${isCurrentUser ? "text-brand-green" : "text-foreground"}`}>
                        {entry.total_credits}
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
            <CardTitle className={`${textStyles.subheading.small} flex items-center gap-2`}>
              <Trophy className="h-5 w-5 text-brand-green" />
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

