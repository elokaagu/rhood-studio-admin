import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { textStyles } from "@/lib/typography";
import {
  Search,
  MapPin,
  Music,
  Calendar,
  User,
  Mail,
  Star,
  UserPlus,
} from "lucide-react";

export default function MembersPage() {
  const members = [
    {
      id: 1,
      name: "Alex Thompson",
      email: "alex@example.com",
      location: "London, UK",
      joinedDate: "2024-01-15",
      gigs: 12,
      rating: 4.8,
      genres: ["Techno", "House"],
      status: "active",
      lastActive: "2 hours ago",
    },
    {
      id: 2,
      name: "Maya Rodriguez",
      email: "maya@example.com",
      location: "Berlin, Germany",
      joinedDate: "2024-02-03",
      gigs: 18,
      rating: 4.9,
      genres: ["Techno", "Industrial"],
      status: "active",
      lastActive: "1 day ago",
    },
    {
      id: 3,
      name: "Kai Johnson",
      email: "kai@example.com",
      location: "Amsterdam, Netherlands",
      joinedDate: "2024-03-12",
      gigs: 8,
      rating: 4.7,
      genres: ["Drum & Bass", "Techno"],
      status: "active",
      lastActive: "3 hours ago",
    },
    {
      id: 4,
      name: "Sofia Martinez",
      email: "sofia@example.com",
      location: "Barcelona, Spain",
      joinedDate: "2024-04-20",
      gigs: 15,
      rating: 4.6,
      genres: ["Deep House", "Melodic Techno"],
      status: "inactive",
      lastActive: "2 weeks ago",
    },
    {
      id: 5,
      name: "Chen Wei",
      email: "chen@example.com",
      location: "Tokyo, Japan",
      joinedDate: "2024-05-08",
      gigs: 6,
      rating: 4.5,
      genres: ["Minimal", "Ambient"],
      status: "active",
      lastActive: "5 minutes ago",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-transparent text-brand-green border-brand-green text-xs">
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-transparent text-gray-400 border-gray-400 text-xs">
            Inactive
          </Badge>
        );
      default:
        return (
          <Badge className="bg-transparent text-gray-400 border-gray-400 text-xs">
            {status}
          </Badge>
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
            MEMBERS
          </h1>
          <p className={textStyles.body.regular}>
            Manage R/HOOD community members
          </p>
        </div>
        <Button className="bg-brand-green text-brand-black hover:bg-brand-green/90">
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members, locations, or genres..."
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
            Active
          </Button>
          <Button variant="outline" size="sm">
            Inactive
          </Button>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        {members.map((member) => (
          <Card key={member.id} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {/* Avatar with Initials */}
                  <Avatar className="h-12 w-12 bg-brand-green">
                    <AvatarFallback className="text-brand-black font-bold">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Member Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={textStyles.subheading.large}>
                        {member.name}
                      </h3>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-muted-foreground">
                          {member.rating}
                        </span>
                      </div>
                    </div>
                    
                    <p className={`${textStyles.body.regular} text-muted-foreground`}>
                      {member.email}
                    </p>
                    
                    {/* Metadata Row */}
                    <div className="flex items-center space-x-6 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {member.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Joined {member.joinedDate}
                      </div>
                      <div className="flex items-center">
                        <Music className="h-4 w-4 mr-1" />
                        {member.gigs} gigs
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Tags and Actions */}
                <div className="flex items-center space-x-2">
                  {member.genres.map((genre) => (
                    <div key={genre}>
                      {getGenreBadge(genre)}
                    </div>
                  ))}
                  {getStatusBadge(member.status)}
                  
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-1" />
                    Message
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
