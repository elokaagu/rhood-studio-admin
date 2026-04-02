"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUserProfile } from "@/lib/auth-utils";
import { fetchBookableDjs } from "@/lib/booking/fetch-bookable-djs";
import { filterBookableDjs } from "@/lib/booking/filter-bookable-djs";
import type { BookableDJ } from "@/lib/booking/bookable-dj";
import { BookableDJCard } from "@/components/admin/book-dj/BookableDJCard";
import {
  Search,
  Filter,
  X,
  Trophy,
  Clock,
  LayoutGrid,
  List,
} from "lucide-react";
import { textStyles } from "@/lib/typography";
import LocationAutocomplete from "@/components/location-autocomplete";

const GENRES = [
  "House",
  "Techno",
  "Drum & Bass",
  "Dubstep",
  "Trap",
  "Hip-Hop",
  "Electronic",
  "Progressive",
  "Trance",
  "Ambient",
  "Breakbeat",
] as const;

export default function BookDJPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [djs, setDjs] = useState<BookableDJ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [creditsFilter, setCreditsFilter] = useState<
    "all" | "top10" | "top50" | "top100"
  >("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<
    "all" | "available" | "busy"
  >("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [brandAccessOk, setBrandAccessOk] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      const profile = await getCurrentUserProfile();
      if (profile?.role !== "brand") {
        toast({
          title: "Access Denied",
          description: "This page is only available for brand accounts.",
          variant: "destructive",
        });
        router.push("/admin/dashboard");
        return;
      }
      setBrandAccessOk(true);
    };
    checkUserRole();
  }, [router, toast]);

  const loadDjs = useCallback(async () => {
    try {
      setIsLoading(true);
      const rows = await fetchBookableDjs();
      setDjs(rows);
    } catch (error) {
      console.error("Error fetching DJs:", error);
      toast({
        title: "Error",
        description: "Failed to load DJs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (brandAccessOk) {
      loadDjs();
    }
  }, [brandAccessOk, loadDjs]);

  const filteredDjs = useMemo(
    () =>
      filterBookableDjs(djs, {
        searchTerm,
        selectedGenre,
        selectedLocation,
        creditsFilter,
        availabilityFilter,
      }),
    [
      djs,
      searchTerm,
      selectedGenre,
      selectedLocation,
      creditsFilter,
      availabilityFilter,
    ]
  );

  const handleBookDJ = useCallback(
    (djId: string) => {
      router.push(`/admin/book-dj/${djId}/request`);
    },
    [router]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className={textStyles.body.regular}>Loading DJs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-blur-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Book a DJ</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Browse and search for DJs to book for your event
          </p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, location, genre, or bio..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              className="pl-10 bg-secondary border-border text-foreground"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Genre</label>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all" className="text-foreground hover:bg-accent">
                    All Genres
                  </SelectItem>
                  {GENRES.map((genre) => (
                    <SelectItem
                      key={genre}
                      value={genre}
                      className="text-foreground hover:bg-accent"
                    >
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Location</label>
              <LocationAutocomplete
                placeholder="Filter by location..."
                value={selectedLocation}
                onValueChange={setSelectedLocation}
                onLocationSelect={(selection) =>
                  setSelectedLocation(selection.formattedAddress || selection.description)
                }
                className="bg-secondary border-border text-foreground"
                country="gb"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                Ranking / Credits
              </label>
              <Select
                value={creditsFilter}
                onValueChange={(v: "all" | "top10" | "top50" | "top100") =>
                  setCreditsFilter(v)
                }
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all" className="text-foreground hover:bg-accent">
                    All DJs
                  </SelectItem>
                  <SelectItem value="top10" className="text-foreground hover:bg-accent">
                    Top 10
                  </SelectItem>
                  <SelectItem value="top50" className="text-foreground hover:bg-accent">
                    Top 50
                  </SelectItem>
                  <SelectItem value="top100" className="text-foreground hover:bg-accent">
                    Top 100
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Availability
              </label>
              <Select
                value={availabilityFilter}
                onValueChange={(v: "all" | "available" | "busy") =>
                  setAvailabilityFilter(v)
                }
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all" className="text-foreground hover:bg-accent">
                    All
                  </SelectItem>
                  <SelectItem value="available" className="text-foreground hover:bg-accent">
                    Available
                  </SelectItem>
                  <SelectItem value="busy" className="text-foreground hover:bg-accent">
                    Busy
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(selectedGenre !== "all" ||
            selectedLocation ||
            creditsFilter !== "all" ||
            availabilityFilter !== "all" ||
            searchTerm) && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedGenre("all");
                  setSelectedLocation("");
                  setCreditsFilter("all");
                  setAvailabilityFilter("all");
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredDjs.length} {filteredDjs.length === 1 ? "DJ" : "DJs"} found
        </p>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 px-3"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {filteredDjs.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No DJs found matching your criteria. Try adjusting your filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 stagger-children"
              : "space-y-4 stagger-children"
          }
        >
          {filteredDjs.map((dj: BookableDJ) => (
            <BookableDJCard
              key={dj.id}
              dj={dj}
              variant={viewMode}
              onBook={handleBookDJ}
            />
          ))}
        </div>
      )}
    </div>
  );
}
