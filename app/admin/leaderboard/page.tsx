"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUserId } from "@/lib/auth-utils";
import {
  fetchLeaderboardAllTime,
  fetchLeaderboardForYear,
  leaderboardDisplayName,
  type LeaderboardEntry,
} from "@/lib/leaderboard/fetch-leaderboard";
import {
  Star,
  Search,
} from "lucide-react";

export default function LeaderboardPage() {
  const { toast } = useToast();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = await getCurrentUserId();
      if (!cancelled) setCurrentUserId(id);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadLeaderboard = useCallback(
    async (year: number | null) => {
      setIsLoading(true);
      try {
        const result =
          year === null
            ? await fetchLeaderboardAllTime()
            : await fetchLeaderboardForYear(year);

        if (!result.ok) {
          setLeaderboard([]);
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
          return;
        }

        setLeaderboard(result.entries);
      } catch (err) {
        setLeaderboard([]);
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to load leaderboard.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadLeaderboard(selectedYear);
  }, [selectedYear, loadLeaderboard]);

  const filteredLeaderboard = useMemo(() => {
    if (!searchTerm.trim()) {
      return leaderboard;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return leaderboard.filter((entry: LeaderboardEntry) => {
      const displayName = leaderboardDisplayName(entry).toLowerCase();
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
    <div className="space-y-6 animate-blur-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`${textStyles.headline.section} text-xl sm:text-2xl md:text-3xl`}>
            Credits Leaderboard
          </h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base mt-1`}>
            Top DJs ranked by credits earned (brands excluded). Admins with credits may appear and are labeled.
          </p>
        </div>

        <div className="flex flex-col items-stretch sm:items-end gap-1">
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
          {selectedYear !== null && (
            <p className="text-xs text-muted-foreground max-w-xs text-right">
              Ranks by credits earned in {selectedYear} (summed from credit transactions).
            </p>
          )}
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className={textStyles.subheading.small}>
              {selectedYear
                ? `${selectedYear} leaderboard (credits earned this year)`
                : "All-time leaderboard"}
            </CardTitle>

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
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
              </div>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <p className={textStyles.body.regular}>
                {selectedYear === null
                  ? "No leaderboard data yet. Credits need to be recorded on profiles."
                  : `No credits recorded for ${selectedYear} yet, or transactions are not set up.`}
              </p>
            </div>
          ) : filteredLeaderboard.length === 0 ? (
            <div className="text-center py-8">
              <p className={textStyles.body.regular}>
                No users found matching &ldquo;{searchTerm}&rdquo;.
              </p>
            </div>
          ) : (
            <div className="space-y-2 stagger-children">
              {filteredLeaderboard.map((entry: LeaderboardEntry) => {
                const isCurrentUser = currentUserId === entry.user_id;
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
                            {leaderboardDisplayName(entry)}
                          </h3>
                          {isCurrentUser && (
                            <Badge variant="outline" className="border-brand-green text-brand-green text-xs">
                              You
                            </Badge>
                          )}
                          {entry.role === "admin" && (
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

      {selectedYear === currentYear && (
        <Card className="bg-card border-border border-brand-green/20">
          <CardHeader>
            <CardTitle className={textStyles.subheading.small}>
              Year-end rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`${textStyles.body.regular} mb-3`}>
              The top 10 DJs at the end of {currentYear} (by credits earned this calendar year) are eligible for special rewards:
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
