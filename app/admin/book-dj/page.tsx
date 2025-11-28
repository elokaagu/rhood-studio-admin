"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserProfile } from "@/lib/auth-utils";
import {
  Search,
  MapPin,
  Music,
  User,
  Star,
  Calendar,
  Play,
  ExternalLink,
  Filter,
  X,
  Trophy,
  Clock,
  LayoutGrid,
  List,
} from "lucide-react";
import { textStyles } from "@/lib/typography";
import LocationAutocomplete from "@/components/location-autocomplete";

interface DJProfile {
  id: string;
  dj_name: string;
  first_name: string;
  last_name: string;
  email: string;
  city: string;
  genres: string[];
  bio: string | null;
  instagram: string | null;
  soundcloud: string | null;
  profile_image_url: string | null;
  rating: number;
  mixCount: number;
  credits: number;
  latestMix: {
    id: string;
    title: string;
    genre: string;
    file_url: string;
    description?: string | null;
  } | null;
  availability?: string; // 'available', 'busy', 'unknown'
}

const genres = [
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
];

export default function BookDJPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [djs, setDjs] = useState<DJProfile[]>([]);
  const [filteredDjs, setFilteredDjs] = useState<DJProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [creditsFilter, setCreditsFilter] = useState<string>("all"); // 'all', 'top10', 'top50', 'top100'
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all"); // 'all', 'available', 'busy'
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid"); // 'grid' or 'list'
  const [userProfile, setUserProfile] = useState<any>(null);

  // Check if user is a brand
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
      setUserProfile(profile);
    };
    checkUserRole();
  }, [router, toast]);

  // Fetch DJs from database
  const fetchDJs = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all DJ profiles (excluding brands and admins)
      const { data: profiles, error: profilesError } = await supabase
        .from("user_profiles")
        .select("*")
        .or("role.is.null,role.neq.brand")
        .neq("role", "brand");

      if (profilesError) {
        throw profilesError;
      }

      // Transform profiles to include mix data and ratings
      const transformedDJs = await Promise.all(
        (profiles || []).map(async (profile: any) => {
          // Calculate rating from ai_matching_feedback
          let rating = 0.0;
          try {
            const { data: feedbackData } = await supabase
              .from("ai_matching_feedback")
              .select("rating")
              .eq("user_id", profile.id);

            if (feedbackData && feedbackData.length > 0) {
              const totalRating = feedbackData.reduce(
                (sum: number, feedback: any) => sum + feedback.rating,
                0
              );
              rating = totalRating / feedbackData.length;
            }
          } catch (ratingError) {
            console.warn("Could not fetch rating for user:", profile.id);
          }

          // Fetch latest approved mix
          let latestMix = null;
          let mixCount = 0;
          try {
            // Only fetch approved mixes
            const { data: mixData, error: mixError } = await supabase
              .from("mixes")
              .select("id, title, genre, file_url, description")
              .eq("uploaded_by", profile.id)
              .eq("status", "approved")
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (!mixError && mixData) {
              latestMix = mixData;
            }

            // Count only approved mixes
            const { count, error: countError } = await supabase
              .from("mixes")
              .select("*", { count: "exact", head: true })
              .eq("uploaded_by", profile.id)
              .eq("status", "approved");

            if (!countError) {
              mixCount = count || 0;
            }
          } catch (mixErr) {
            console.warn("Could not fetch mixes for user:", profile.id, mixErr);
          }

          // Get credits
          const credits = (profile.credits as number) || 0;

          // Check availability (based on upcoming bookings)
          let availability = "unknown";
          try {
            const { data: upcomingBookings } = await supabase
              .from("booking_requests")
              .select("id, event_date, status")
              .eq("dj_id", profile.id)
              .in("status", ["pending", "accepted"])
              .gte("event_date", new Date().toISOString())
              .limit(5);

            // Check if DJ has many upcoming bookings (considered "busy")
            if (upcomingBookings && upcomingBookings.length >= 3) {
              availability = "busy";
            } else if (upcomingBookings && upcomingBookings.length > 0) {
              availability = "available";
            } else {
              availability = "available";
            }
          } catch (availabilityErr) {
            console.warn("Could not check availability for user:", profile.id);
          }

          return {
            id: profile.id,
            dj_name: profile.dj_name || "",
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            email: profile.email || "",
            city: profile.city || "",
            genres: profile.genres || [],
            bio: profile.bio || null,
            instagram: profile.instagram || null,
            soundcloud: profile.soundcloud || null,
            profile_image_url: profile.profile_image_url || null,
            rating: Math.round(rating * 10) / 10,
            mixCount,
            credits,
            latestMix,
            availability,
          };
        })
      );

      // Sort by credits (highest first)
      transformedDJs.sort((a, b) => b.credits - a.credits);
      
      setDjs(transformedDJs);
      setFilteredDjs(transformedDJs);
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
  };

  useEffect(() => {
    if (userProfile) {
      fetchDJs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  // Apply filters
  useEffect(() => {
    let filtered = [...djs];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (dj) =>
          dj.dj_name.toLowerCase().includes(searchLower) ||
          dj.first_name.toLowerCase().includes(searchLower) ||
          dj.last_name.toLowerCase().includes(searchLower) ||
          dj.city.toLowerCase().includes(searchLower) ||
          dj.bio?.toLowerCase().includes(searchLower) ||
          dj.genres.some((g) => g.toLowerCase().includes(searchLower))
      );
    }

    // Genre filter
    if (selectedGenre !== "all") {
      filtered = filtered.filter((dj) =>
        dj.genres.includes(selectedGenre)
      );
    }

    // Location filter
    if (selectedLocation) {
      filtered = filtered.filter((dj) =>
        dj.city.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Credits/Ranking filter
    if (creditsFilter !== "all") {
      const sortedByCredits = [...filtered].sort((a, b) => b.credits - a.credits);
      if (creditsFilter === "top10") {
        filtered = sortedByCredits.slice(0, 10);
      } else if (creditsFilter === "top50") {
        filtered = sortedByCredits.slice(0, 50);
      } else if (creditsFilter === "top100") {
        filtered = sortedByCredits.slice(0, 100);
      }
    }

    // Availability filter
    if (availabilityFilter !== "all") {
      filtered = filtered.filter((dj) => dj.availability === availabilityFilter);
    }

    setFilteredDjs(filtered);
  }, [searchTerm, selectedGenre, selectedLocation, creditsFilter, availabilityFilter, djs]);

  const handleBookDJ = (djId: string) => {
    router.push(`/admin/book-dj/${djId}/request`);
  };

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Book a DJ
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Browse and search for DJs to book for your event
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, location, genre, or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-secondary border-border text-foreground"
            />
          </div>

          {/* Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Genre Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Genre</label>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem
                    value="all"
                    className="text-foreground hover:bg-accent"
                  >
                    All Genres
                  </SelectItem>
                  {genres.map((genre) => (
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

            {/* Location Filter */}
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

            {/* Credits/Ranking Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                Ranking / Credits
              </label>
              <Select value={creditsFilter} onValueChange={setCreditsFilter}>
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

            {/* Availability Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Availability
              </label>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
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

          {/* Clear Filters */}
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

      {/* Results Count and View Toggle */}
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

      {/* DJ Cards - Grid or List View */}
      {filteredDjs.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No DJs found matching your criteria. Try adjusting your filters.
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredDjs.map((dj) => (
            <Card
              key={dj.id}
              className="bg-card border-border hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Avatar */}
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
                    <AvatarImage
                      src={dj.profile_image_url || "/person1.jpg"}
                      alt={dj.dj_name}
                    />
                    <AvatarFallback>
                      {dj.dj_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* DJ Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {dj.dj_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {dj.city}
                        </span>
                      </div>
                    </div>

                    {/* Rating and Credits */}
                    <div className="flex items-center gap-3">
                      {dj.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium text-foreground">
                            {dj.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                      {dj.credits > 0 && (
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-brand-green" />
                          <span className="text-sm font-medium text-foreground">
                            {dj.credits} credits
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Availability Badge */}
                    {dj.availability && dj.availability !== "unknown" && (
                      <div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            dj.availability === "available"
                              ? "border-green-500 text-green-500"
                              : "border-orange-500 text-orange-500"
                          }`}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {dj.availability === "available" ? "Available" : "Busy"}
                        </Badge>
                      </div>
                    )}

                    {/* Genres */}
                    {dj.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {dj.genres.slice(0, 3).map((genre) => (
                          <Badge
                            key={genre}
                            variant="outline"
                            className="text-xs border-border text-foreground"
                          >
                            {genre}
                          </Badge>
                        ))}
                        {dj.genres.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-xs border-border text-foreground"
                          >
                            +{dj.genres.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Mix Info */}
                    {dj.latestMix && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Music className="h-4 w-4" />
                          <span>
                            {dj.mixCount} {dj.mixCount === 1 ? "mix" : "mixes"}
                          </span>
                        </div>
                        {dj.latestMix.title && (
                          <div className="text-xs font-medium text-foreground truncate">
                            Latest: {dj.latestMix.title}
                          </div>
                        )}
                        {dj.latestMix.description && (
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {dj.latestMix.description}
                          </div>
                        )}
                        {dj.latestMix.genre && (
                          <Badge variant="outline" className="text-xs border-border text-foreground mt-1">
                            {dj.latestMix.genre}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Bio Preview */}
                    {dj.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {dj.bio}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/members/${dj.id}`)}
                        className="flex-1"
                      >
                        <User className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                      <Button
                        onClick={() => handleBookDJ(dj.id)}
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                        size="sm"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Book DJ
                      </Button>
                      {dj.latestMix && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const mixUrl = supabase.storage
                              .from("mixes")
                              .getPublicUrl(dj.latestMix!.file_url).data.publicUrl;
                            window.open(mixUrl, "_blank");
                          }}
                          className="flex-1"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Play Mix
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDjs.map((dj) => (
            <Card
              key={dj.id}
              className="bg-card border-border hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {/* Avatar */}
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
                    <AvatarImage
                      src={dj.profile_image_url || "/person1.jpg"}
                      alt={dj.dj_name}
                    />
                    <AvatarFallback>
                      {dj.dj_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-foreground truncate">
                          {dj.dj_name}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {dj.city}
                            </span>
                          </div>
                          {dj.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium text-foreground">
                                {dj.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                          {dj.credits > 0 && (
                            <div className="flex items-center gap-1">
                              <Trophy className="h-4 w-4 text-brand-green" />
                              <span className="text-sm font-medium text-foreground">
                                {dj.credits} credits
                              </span>
                            </div>
                          )}
                          {dj.availability && dj.availability !== "unknown" && (
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                dj.availability === "available"
                                  ? "border-green-500 text-green-500"
                                  : "border-orange-500 text-orange-500"
                              }`}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {dj.availability === "available" ? "Available" : "Busy"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/members/${dj.id}`)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                        <Button
                          onClick={() => handleBookDJ(dj.id)}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          size="sm"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Book DJ
                        </Button>
                        {dj.latestMix && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const mixUrl = supabase.storage
                                .from("mixes")
                                .getPublicUrl(dj.latestMix!.file_url).data.publicUrl;
                              window.open(mixUrl, "_blank");
                            }}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Play Mix
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Genres */}
                    {dj.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {dj.genres.map((genre) => (
                          <Badge
                            key={genre}
                            variant="outline"
                            className="text-xs border-border text-foreground"
                          >
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Mix Info and Bio */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      {dj.latestMix && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Music className="h-4 w-4" />
                            <span>
                              {dj.mixCount} {dj.mixCount === 1 ? "mix" : "mixes"}
                            </span>
                          </div>
                          {dj.latestMix.title && (
                            <div className="text-xs font-medium text-foreground truncate">
                              Latest: {dj.latestMix.title}
                            </div>
                          )}
                          {dj.latestMix.genre && (
                            <Badge variant="outline" className="text-xs border-border text-foreground mt-1">
                              {dj.latestMix.genre}
                            </Badge>
                          )}
                        </div>
                      )}
                      {dj.bio && (
                        <div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {dj.bio}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

