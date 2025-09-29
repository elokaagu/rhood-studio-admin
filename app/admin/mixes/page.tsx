"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { textStyles } from "@/lib/typography";
import {
  Play,
  Pause,
  Download,
  Eye,
  Trash2,
  Music,
  Clock,
  Calendar,
  Star,
  Search,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function MixesPage() {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const mixes = [
    {
      id: 1,
      title: "Underground Techno Mix #1",
      artist: "Alex Thompson",
      duration: "58:23",
      uploadDate: "2024-08-10",
      plays: 1247,
      rating: 4.8,
      appliedFor: "Underground Warehouse Rave",
      genre: "Techno",
      status: "approved",
      audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Demo audio file
    },
    {
      id: 2,
      title: "Summer House Vibes",
      artist: "Maya Rodriguez",
      duration: "45:12",
      uploadDate: "2024-08-12",
      plays: 892,
      rating: 4.9,
      appliedFor: "Rooftop Summer Sessions",
      genre: "House",
      status: "pending",
      audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Demo audio file
    },
    {
      id: 3,
      title: "Drum & Bass Energy",
      artist: "Kai Johnson",
      duration: "52:45",
      uploadDate: "2024-08-14",
      plays: 634,
      rating: 4.7,
      appliedFor: "Club Residency Audition",
      genre: "Drum & Bass",
      status: "approved",
      audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Demo audio file
    },
    {
      id: 4,
      title: "Deep House Journey",
      artist: "Sofia Martinez",
      duration: "61:18",
      uploadDate: "2024-08-16",
      plays: 1105,
      rating: 4.6,
      appliedFor: "Rooftop Summer Sessions",
      genre: "Deep House",
      status: "rejected",
      audioUrl: "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav", // Demo audio file
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500 text-white text-xs">Approved</Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500 text-white text-xs">Rejected</Badge>
        );
      case "pending":
        return (
          <Badge className="bg-orange-500 text-white text-xs">Pending</Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 text-white text-xs">{status}</Badge>
        );
    }
  };

  const getGenreBadge = (genre: string) => {
    return (
      <Badge
        variant="outline"
        className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase"
      >
        {genre}
      </Badge>
    );
  };

  const handlePlayPause = (mixId: number, audioUrl: string) => {
    if (currentlyPlaying === mixId && isPlaying) {
      // Pause current audio
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Set up event listeners
      audio.onplay = () => {
        setIsPlaying(true);
        setCurrentlyPlaying(mixId);
      };

      audio.onpause = () => {
        setIsPlaying(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentlyPlaying(null);
      };

      audio.onerror = () => {
        console.error("Error playing audio");
        alert(
          "Unable to play audio. This is a demo with placeholder audio files."
        );
      };

      // Play the audio
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
        alert(
          "Unable to play audio. This is a demo with placeholder audio files."
        );
      });
    }
  };

  const handleDownload = (mixTitle: string) => {
    // In a real app, this would download the actual mix file
    console.log(`Downloading mix: ${mixTitle}`);
    alert(
      `Download functionality would download the actual mix file for: ${mixTitle}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
            MIXES
          </h1>
          <p className={textStyles.body.regular}>
            Review and manage submitted DJ mixes
          </p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mixes, artists, or genres..."
            className="pl-10 bg-secondary border-border text-foreground"
          />
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-brand-green text-brand-black hover:bg-brand-green/90"
          >
            All
          </Button>
          <Button variant="outline" size="sm">
            Pending
          </Button>
          <Button variant="outline" size="sm">
            Approved
          </Button>
          <Button variant="outline" size="sm">
            Rejected
          </Button>
        </div>
      </div>

      {/* Mixes List */}
      <div className="space-y-4">
        {mixes.map((mix) => (
          <Card key={mix.id} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {/* Play Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-secondary border-border hover:bg-accent"
                    onClick={() => handlePlayPause(mix.id, mix.audioUrl)}
                  >
                    {currentlyPlaying === mix.id && isPlaying ? (
                      <Pause className="h-4 w-4 text-foreground" />
                    ) : (
                      <Play className="h-4 w-4 text-foreground" />
                    )}
                  </Button>

                  {/* Mix Info */}
                  <div className="flex-1">
                    <h3 className={textStyles.subheading.large}>{mix.title}</h3>
                    <p
                      className={`${textStyles.body.regular} text-muted-foreground`}
                    >
                      by {mix.artist}
                    </p>

                    {/* Metadata Row */}
                    <div className="flex items-center space-x-6 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {mix.duration}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {mix.uploadDate}
                      </div>
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {mix.plays} plays
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {mix.rating}
                      </div>
                    </div>

                    {/* Applied For */}
                    <p className={`${textStyles.body.small} mt-2`}>
                      Applied for: {mix.appliedFor}
                    </p>
                  </div>
                </div>

                {/* Right Side - Tags and Actions */}
                <div className="flex items-center space-x-2">
                  {getGenreBadge(mix.genre)}
                  {getStatusBadge(mix.status)}

                  {mix.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-brand-green text-brand-black hover:bg-brand-green/90"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(mix.title)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
