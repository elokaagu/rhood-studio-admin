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
  const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear());
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
      
      // @ts-ignore - RPC function not in types yet (migration needed)
      if (year) {
        // Yearly leaderboard
        const { data, error } = await (supabase.rpc as any)("get_credits_leaderboard", {
          p_year: year,
          p_limit: 100,
        });

        if (error) {
          throw error;
        }

        setLeaderboard((data as LeaderboardEntry[]) || []);
      } else {
        // All-time leaderboard
        const { data, error } = await (supabase.rpc as any)("get_credits_leaderboard", {
          p_year: null,
          p_limit: 100,
        });

        if (error) {
          throw error;
        }

        setLeaderboard((data as LeaderboardEntry[]) || []);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

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
          {years.map((year) => (
            <Button
              key={year}
              variant={selectedYear === year ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedYear(year)}
              className="text-xs sm:text-sm"
            >
              {year}
            </Button>
          ))}
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
            <div className="space-y-2">
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

