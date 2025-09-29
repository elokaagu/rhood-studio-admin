import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Search,
  MapPin,
  Music,
  Calendar,
  User,
  Mail,
  Phone,
  Instagram,
  Cloud,
  Filter,
  MoreHorizontal,
} from "lucide-react";

export default function MembersPage() {
  const members = [
    {
      id: 1,
      name: "Alex Thompson",
      djName: "DJ AlexT",
      avatar: "/person1.jpg",
      location: "London, UK",
      genres: ["Techno", "House", "Electronic"],
      joinedDate: "2024-01-10",
      status: "active",
      applications: 3,
      approved: 2,
      email: "alex@example.com",
      instagram: "@alexthompson",
      soundcloud: "alexthompson-music",
    },
    {
      id: 2,
      name: "Maya Rodriguez",
      djName: "Maya R",
      avatar: "/person2.jpg",
      location: "Berlin, Germany",
      genres: ["Electronic", "Progressive", "Ambient"],
      joinedDate: "2024-01-15",
      status: "active",
      applications: 5,
      approved: 4,
      email: "maya@example.com",
      instagram: "@mayarodriguez",
      soundcloud: "mayarodriguez-music",
    },
    {
      id: 3,
      name: "James Chen",
      djName: "JC Beats",
      avatar: "/person1.jpg",
      location: "Amsterdam, Netherlands",
      genres: ["Drum & Bass", "Dubstep", "Trap"],
      joinedDate: "2024-01-20",
      status: "inactive",
      applications: 1,
      approved: 0,
      email: "james@example.com",
      instagram: "@jcbeats",
      soundcloud: "jcbeats-music",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="text-muted-foreground">Manage DJ community members</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            className="pl-10 bg-secondary border-border text-foreground"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-foreground">2</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New This Month</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-foreground">1</p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        {members.map((member) => (
          <Card key={member.id} className="bg-card border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-foreground">
                      {member.name}
                    </CardTitle>
                    <p className="text-primary font-semibold">
                      {member.djName}
                    </p>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {member.location}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`text-xs ${getStatusColor(member.status)}`}>
                    {member.status}
                  </Badge>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Contact
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {member.email}
                    </div>
                    <div className="flex items-center">
                      <Instagram className="h-4 w-4 mr-2" />
                      {member.instagram}
                    </div>
                    <div className="flex items-center">
                      <Cloud className="h-4 w-4 mr-2" />
                      {member.soundcloud}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Genres</h4>
                  <div className="flex flex-wrap gap-1">
                    {member.genres.map((genre) => (
                      <Badge key={genre} variant="outline" className="text-xs">
                        <Music className="h-3 w-3 mr-1" />
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Activity
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Applications: {member.applications}</div>
                    <div>Approved: {member.approved}</div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Joined: {member.joinedDate}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
