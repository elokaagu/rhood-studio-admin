import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Edit, 
  Star, 
  MapPin, 
  Calendar,
  Music,
  Instagram,
  Cloud,
  Zap,
  DollarSign,
  Users,
  Settings,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import alexProfileImg from '@/assets/alex-profile.jpg';
import rhoodLogo from '@/assets/rhood-logo.png';

const mockProfile = {
  name: "Alex Thompson",
  username: "@alexbeats",
  bio: "Underground techno enthusiast with 5 years of experience. Specializing in dark, industrial beats that make crowds move. Always looking for new opportunities to showcase my sound.",
  location: "London, UK",
  genres: ["Techno", "House", "Industrial", "Drum & Bass"],
  rating: 4.8,
  totalGigs: 12,
  credits: 156,
  joinDate: "March 2024",
  socialLinks: {
    instagram: "@alexbeats_official",
    soundcloud: "soundcloud.com/alexbeats"
  },
  recentGigs: [
    {
      id: 1,
      name: "Warehouse Sessions #12",
      venue: "East London Warehouse",
      date: "2024-07-20",
      fee: "£300",
      rating: 5
    },
    {
      id: 2,
      name: "Underground Collective",
      venue: "Secret Location",
      date: "2024-07-08",
      fee: "£250",
      rating: 4.5
    },
    {
      id: 3,
      name: "Basement Rave",
      venue: "Camden Club",
      date: "2024-06-25",
      fee: "£400",
      rating: 5
    }
  ]
};

const Profile = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/feed')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <button onClick={() => navigate('/')} className="flex items-center">
            <img 
              src={rhoodLogo} 
              alt="R/HOOD Logo" 
              className="w-8 h-8 mr-2"
            />
            <h1 className="text-xl font-bold text-foreground">Profile</h1>
          </button>
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Profile Header */}
        <Card className="bg-gradient-dark border-primary/30">
          <CardContent className="p-6 text-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden">
                <img 
                  src={alexProfileImg} 
                  alt="Alex Thompson"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute -top-2 -right-2 h-8 w-8"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            
            <h2 className="text-xl font-bold text-foreground mb-1">{mockProfile.name}</h2>
            <p className="text-muted-foreground mb-2">{mockProfile.username}</p>
            
            <div className="flex items-center justify-center mb-4">
              <Star className="h-4 w-4 text-accent mr-1" />
              <span className="text-foreground font-medium">{mockProfile.rating}</span>
              <span className="text-muted-foreground ml-1">• {mockProfile.totalGigs} gigs</span>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{mockProfile.bio}</p>

            <div className="flex items-center justify-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{mockProfile.location}</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{mockProfile.credits}</p>
              <p className="text-sm text-muted-foreground">Credits</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{mockProfile.totalGigs}</p>
              <p className="text-sm text-muted-foreground">Gigs Done</p>
            </CardContent>
          </Card>
        </div>

        {/* Genres */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Music className="h-5 w-5 mr-2" />
              Genres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {mockProfile.genres.map((genre) => (
                <Badge key={genre} variant="outline" className="border-primary text-primary">
                  {genre}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audio Mix */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Volume2 className="h-5 w-5 mr-2" />
              Audio ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-secondary rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Dark Industrial Mix #1</h4>
                  <p className="text-sm text-muted-foreground">5:23 • Deep Techno</p>
                </div>
                <Button
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-primary hover:bg-primary/10"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
              </div>
              
              {/* Mock Waveform */}
              <div className="flex items-center space-x-1 h-8">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 bg-primary/30 rounded-full transition-all duration-75 ${
                      isPlaying && i < 12 ? 'bg-primary' : ''
                    }`}
                    style={{ 
                      height: `${Math.random() * 100 + 20}%`,
                      animationDelay: isPlaying ? `${i * 50}ms` : '0ms'
                    }}
                  />
                ))}
              </div>
              
              {/* Progress Bar */}
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>1:23</span>
                <div className="flex-1 h-1 bg-secondary-foreground/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000"
                    style={{ width: isPlaying ? '25%' : '20%' }}
                  />
                </div>
                <span>5:23</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Social Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center">
              <Instagram className="h-5 w-5 text-pink-500 mr-3" />
              <span className="text-foreground">{mockProfile.socialLinks.instagram}</span>
            </div>
            <div className="flex items-center">
              <Cloud className="h-5 w-5 text-orange-500 mr-3" />
              <span className="text-foreground">{mockProfile.socialLinks.soundcloud}</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Gigs */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Recent Gigs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockProfile.recentGigs.map((gig, index) => (
              <div key={gig.id}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{gig.name}</h4>
                    <p className="text-sm text-muted-foreground">{gig.venue}</p>
                    <p className="text-xs text-muted-foreground">{gig.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary">{gig.fee}</p>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-accent mr-1" />
                      <span className="text-xs text-foreground">{gig.rating}</span>
                    </div>
                  </div>
                </div>
                {index < mockProfile.recentGigs.length - 1 && (
                  <Separator className="mt-4 bg-border" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Member Since */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Member since {mockProfile.joinDate}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;