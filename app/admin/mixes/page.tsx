import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Play,
  Pause,
  Download,
  Eye,
  Trash2,
  Music,
  Clock,
  User,
  Calendar,
  ThumbsUp,
  MessageCircle,
} from "lucide-react";

export default function MixesPage() {
  const mixes = [
    {
      id: 1,
      title: "Underground Techno Session",
      dj: {
        name: "Alex Thompson",
        djName: "DJ AlexT",
        avatar: "/person1.jpg",
      },
      duration: "2:34:15",
      genre: "Techno",
      uploadDate: "2024-01-15",
      status: "approved",
      plays: 1247,
      likes: 89,
      comments: 23,
      description:
        "Deep underground techno mix recorded live at warehouse rave",
    },
    {
      id: 2,
      title: "Sunset House Vibes",
      dj: {
        name: "Maya Rodriguez",
        djName: "Maya R",
        avatar: "/person2.jpg",
      },
      duration: "1:45:30",
      genre: "House",
      uploadDate: "2024-01-18",
      status: "pending",
      plays: 892,
      likes: 67,
      comments: 15,
      description: "Chill house music perfect for sunset sessions",
    },
    {
      id: 3,
      title: "Electronic Journey",
      dj: {
        name: "James Chen",
        djName: "JC Beats",
        avatar: "/person1.jpg",
      },
      duration: "3:12:45",
      genre: "Electronic",
      uploadDate: "2024-01-20",
      status: "rejected",
      plays: 456,
      likes: 34,
      comments: 8,
      description: "Progressive electronic mix with ambient elements",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
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
          <h1 className="text-2xl font-bold text-foreground">Mixes</h1>
          <p className="text-muted-foreground">Review and manage DJ mixes</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Mixes</p>
                <p className="text-2xl font-bold text-foreground">3</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Music className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-foreground">1</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-foreground">1</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <Music className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Plays</p>
                <p className="text-2xl font-bold text-foreground">2,595</p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Play className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mixes List */}
      <div className="space-y-4">
        {mixes.map((mix) => (
          <Card key={mix.id} className="bg-card border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="h-16 w-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                    <Music className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-foreground">
                      {mix.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={mix.dj.avatar} alt={mix.dj.name} />
                        <AvatarFallback>
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {mix.dj.djName}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`text-xs ${getStatusColor(mix.status)}`}>
                    {mix.status}
                  </Badge>
                  <Badge variant="outline">{mix.genre}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{mix.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  {mix.duration}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Play className="h-4 w-4 mr-2" />
                  {mix.plays} plays
                </div>
                <div className="flex items-center text-muted-foreground">
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {mix.likes} likes
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {mix.comments} comments
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  Uploaded: {mix.uploadDate}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Play className="h-4 w-4 mr-1" />
                    Play
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Review
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  {mix.status === "pending" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
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
