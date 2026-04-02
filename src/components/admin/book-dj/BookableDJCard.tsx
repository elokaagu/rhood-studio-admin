"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Music,
  User,
  Star,
  Calendar,
  Play,
  Trophy,
  Clock,
} from "lucide-react";
import type { BookableDJ } from "@/lib/booking/bookable-dj";
import { getMixPublicUrl } from "@/lib/booking/fetch-bookable-djs";

type Props = {
  dj: BookableDJ;
  variant: "grid" | "list";
  onBook: (djId: string) => void;
};

export function BookableDJCard({ dj, variant, onBook }: Props) {
  const router = useRouter();

  const openMix = () => {
    if (!dj.latestMix?.file_url) return;
    window.open(getMixPublicUrl(dj.latestMix.file_url), "_blank");
  };

  if (variant === "grid") {
    return (
      <Card className="bg-card border-border hover:shadow-lg transition-shadow">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
              <AvatarImage src={dj.profile_image_url || "/person1.jpg"} alt={dj.dj_name} />
              <AvatarFallback>{dj.dj_name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-lg text-foreground">{dj.dj_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{dj.city}</span>
                </div>
              </div>

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

              {dj.availability && (
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
                    <Badge variant="outline" className="text-xs border-border text-foreground">
                      +{dj.genres.length - 3}
                    </Badge>
                  )}
                </div>
              )}

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
                    <Badge
                      variant="outline"
                      className="text-xs border-border text-foreground mt-1"
                    >
                      {dj.latestMix.genre}
                    </Badge>
                  )}
                </div>
              )}

              {dj.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">{dj.bio}</p>
              )}

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
                  onClick={() => onBook(dj.id)}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  size="sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book DJ
                </Button>
                {dj.latestMix && (
                  <Button variant="outline" size="sm" onClick={openMix} className="flex-1">
                    <Play className="h-4 w-4 mr-2" />
                    Play Mix
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border hover:shadow-lg transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0">
            <AvatarImage src={dj.profile_image_url || "/person1.jpg"} alt={dj.dj_name} />
            <AvatarFallback>{dj.dj_name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg text-foreground truncate">{dj.dj_name}</h3>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{dj.city}</span>
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
                  {dj.availability && (
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
                  onClick={() => onBook(dj.id)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  size="sm"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book DJ
                </Button>
                {dj.latestMix && (
                  <Button variant="outline" size="sm" onClick={openMix}>
                    <Play className="h-4 w-4 mr-2" />
                    Play Mix
                  </Button>
                )}
              </div>
            </div>

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
                    <Badge
                      variant="outline"
                      className="text-xs border-border text-foreground mt-1"
                    >
                      {dj.latestMix.genre}
                    </Badge>
                  )}
                </div>
              )}
              {dj.bio && (
                <div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{dj.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
