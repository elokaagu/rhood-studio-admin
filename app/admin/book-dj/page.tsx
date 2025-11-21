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
  latestMix: {
    id: string;
    title: string;
    genre: string;
    file_url: string;
  } | null;
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
  const [hasMixFilter, setHasMixFilter] = useState<boolean>(false);
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

          // Fetch latest mix
          let latestMix = null;
          let mixCount = 0;
          try {
            const { data: mixData, error: mixError } = await supabase
              .from("mixes")
              .select("id, title, genre, file_url")
              .eq("uploaded_by", profile.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (!mixError && mixData) {
              latestMix = mixData;
            }

            // Count total mixes
            const { count } = await supabase
              .from("mixes")
              .select("*", { count: "exact", head: true })
              .eq("uploaded_by", profile.id);

            mixCount = count || 0;
          } catch (mixErr) {
            console.warn("Could not fetch mixes for user:", profile.id);
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
            latestMix,
          };
        })
      );

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

    // Mix filter
    if (hasMixFilter) {
      filtered = filtered.filter((dj) => dj.mixCount > 0);
    }

    setFilteredDjs(filtered);
  }, [searchTerm, selectedGenre, selectedLocation, hasMixFilter, djs]);

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

            {/* Mix Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Has Mix</label>
              <div className="flex items-center space-x-2">
                <Button
                  variant={hasMixFilter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHasMixFilter(!hasMixFilter)}
                  className="w-full"
                >
                  {hasMixFilter ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </>
                  ) : (
                    <>
                      <Music className="h-4 w-4 mr-2" />
                      Has Mix
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedGenre !== "all" ||
              selectedLocation ||
              hasMixFilter ||
              searchTerm) && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground opacity-0">
                  Clear
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedGenre("all");
                    setSelectedLocation("");
                    setHasMixFilter(false);
                  }}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredDjs.length} {filteredDjs.length === 1 ? "DJ" : "DJs"} found
        </p>
      </div>

      {/* DJ Cards Grid */}
      {filteredDjs.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No DJs found matching your criteria. Try adjusting your filters.
            </p>
          </CardContent>
        </Card>
      ) : (
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

                    {/* Rating */}
                    {dj.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-foreground">
                          {dj.rating.toFixed(1)}
                        </span>
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Music className="h-4 w-4" />
                        <span>
                          {dj.mixCount} {dj.mixCount === 1 ? "mix" : "mixes"}
                        </span>
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
      )}
    </div>
  );
}

