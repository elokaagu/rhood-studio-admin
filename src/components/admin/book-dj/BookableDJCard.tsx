"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, User, Calendar, Play, Trophy, Music } from "lucide-react";
import type { BookableDJ } from "@/lib/booking/bookable-dj";
import { getMixPublicUrl } from "@/lib/booking/fetch-bookable-djs";

type Props = {
  dj: BookableDJ;
  variant: "grid" | "list";
  onBook: (djId: string) => void;
};

function AvailabilityPill({ status }: { status: string }) {
  const available = status === "available";
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
        available
          ? "bg-green-500/15 text-green-400 border border-green-500/30"
          : "bg-orange-500/15 text-orange-400 border border-orange-500/30"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          available ? "bg-green-400" : "bg-orange-400"
        }`}
      />
      {available ? "Available" : "Busy"}
    </span>
  );
}

export function BookableDJCard({ dj, variant, onBook }: Props) {
  const router = useRouter();

  const openMix = () => {
    if (!dj.latestMix?.file_url) return;
    window.open(getMixPublicUrl(dj.latestMix.file_url), "_blank");
  };

  if (variant === "grid") {
    return (
      <Card className="bg-card border-border hover:border-brand-green/40 transition-all duration-200 hover:shadow-xl overflow-hidden flex flex-col">
        <div className="h-0.5 bg-brand-green" />
        <CardContent className="p-5 flex flex-col flex-1">
          {/* Avatar + name */}
          <div className="flex items-start gap-4 mb-4">
            <Avatar className="h-16 w-16 flex-shrink-0 ring-2 ring-brand-green/20">
              <AvatarImage
                src={dj.profile_image_url || "/person1.jpg"}
                alt={dj.dj_name}
              />
              <AvatarFallback className="bg-brand-green/10 text-brand-green font-bold text-lg">
                {dj.dj_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-foreground leading-tight truncate">
                {dj.dj_name}
              </h3>
              {dj.city && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    {dj.city}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {dj.credits > 0 && (
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-brand-green" />
                    <span className="text-xs font-medium text-foreground">
                      {dj.credits} credits
                    </span>
                  </div>
                )}
                {dj.availability && (
                  <AvailabilityPill status={dj.availability} />
                )}
              </div>
            </div>
          </div>

          {/* Genres */}
          {dj.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {dj.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground bg-secondary/50"
                >
                  {genre}
                </span>
              ))}
              {dj.genres.length > 3 && (
                <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground bg-secondary/50">
                  +{dj.genres.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Bio */}
          {dj.bio && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {dj.bio}
            </p>
          )}

          {/* Latest mix */}
          {dj.latestMix && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Music className="h-3 w-3" />
              <span>
                {dj.mixCount} {dj.mixCount === 1 ? "mix" : "mixes"}
              </span>
              {dj.latestMix.title && (
                <>
                  <span className="text-border">·</span>
                  <span className="truncate font-medium text-foreground/70">
                    {dj.latestMix.title}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Buttons pushed to bottom */}
          <div className="flex gap-2 mt-auto pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/admin/members/${dj.id}`)}
              className="flex-1 h-8 text-xs"
            >
              <User className="h-3 w-3 mr-1.5" />
              View Profile
            </Button>
            <Button
              onClick={() => onBook(dj.id)}
              size="sm"
              className="flex-1 h-8 text-xs bg-brand-green hover:bg-brand-green/90 text-brand-black font-semibold"
            >
              <Calendar className="h-3 w-3 mr-1.5" />
              Book DJ
            </Button>
            {dj.latestMix && (
              <Button
                variant="outline"
                size="sm"
                onClick={openMix}
                className="h-8 w-8 p-0 flex-shrink-0"
                title="Play latest mix"
              >
                <Play className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // List variant
  return (
    <Card className="bg-card border-border hover:border-brand-green/40 transition-all duration-200">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-brand-green/20">
            <AvatarImage
              src={dj.profile_image_url || "/person1.jpg"}
              alt={dj.dj_name}
            />
            <AvatarFallback className="bg-brand-green/10 text-brand-green font-bold">
              {dj.dj_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base text-foreground truncate">
                  {dj.dj_name}
                </h3>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {dj.city && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{dj.city}</span>
                    </div>
                  )}
                  {dj.credits > 0 && (
                    <div className="flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-brand-green" />
                      <span className="text-xs font-medium text-foreground">
                        {dj.credits} credits
                      </span>
                    </div>
                  )}
                  {dj.availability && (
                    <AvailabilityPill status={dj.availability} />
                  )}
                </div>
                {dj.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {dj.genres.map((genre) => (
                      <span
                        key={genre}
                        className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground bg-secondary/50"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
                {dj.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-2">
                    {dj.bio}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/admin/members/${dj.id}`)}
                  className="h-8 text-xs"
                >
                  <User className="h-3 w-3 mr-1.5" />
                  View Profile
                </Button>
                <Button
                  onClick={() => onBook(dj.id)}
                  size="sm"
                  className="h-8 text-xs bg-brand-green hover:bg-brand-green/90 text-brand-black font-semibold"
                >
                  <Calendar className="h-3 w-3 mr-1.5" />
                  Book DJ
                </Button>
                {dj.latestMix && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openMix}
                    className="h-8 w-8 p-0"
                    title="Play latest mix"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
