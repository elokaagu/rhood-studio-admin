import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Heart, 
  X, 
  MessageCircle, 
  Music,
  MapPin,
  Star,
  Instagram,
  Cloud,
  Users,
  Zap,
  Settings,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import rhoodLogo from '@/assets/rhood-logo.png';

// Import person images
import person1 from '@/assets/person1.jpg';
import person2 from '@/assets/person2.jpg';

const mockDJs = [
  {
    id: 1,
    name: "Maya Rodriguez",
    username: "@mayabeats",
    location: "Berlin, Germany",
    genres: ["House", "Techno", "Progressive"],
    rating: 4.9,
    totalGigs: 28,
    bio: "Berlin-based DJ with a passion for deep, hypnotic soundscapes. Looking to collaborate on international projects.",
    profileImage: person1,
    socialLinks: {
      instagram: "@mayabeats_berlin",
      soundcloud: "soundcloud.com/mayabeats"
    },
    isOnline: true,
    audioMix: {
      title: "Berlin Underground Mix",
      duration: "4:45",
      genre: "Deep House"
    }
  },
  {
    id: 2,
    name: "Kai Johnson",
    username: "@djkai",
    location: "Amsterdam, Netherlands",
    genres: ["Drum & Bass", "Breakbeat", "Electronic"],
    rating: 4.7,
    totalGigs: 15,
    bio: "Amsterdam underground scene veteran. Always down for experimental sounds and pushing boundaries.",
    profileImage: person2,
    socialLinks: {
      instagram: "@djkai_amsterdam",
      soundcloud: "soundcloud.com/djkai"
    },
    isOnline: false,
    audioMix: {
      title: "Amsterdam Bass Drop",
      duration: "5:12",
      genre: "Drum & Bass"
    }
  },
  {
    id: 3,
    name: "Luna Martinez",
    username: "@lunamix",
    location: "Barcelona, Spain",
    genres: ["Trance", "Progressive", "Ambient"],
    rating: 4.8,
    totalGigs: 22,
    bio: "Ethereal soundscapes meet dancefloor energy. Looking for like-minded artists for festival collaborations.",
    profileImage: person1, // Using person1 again since we only have 2 images
    socialLinks: {
      instagram: "@lunamix_official",
      soundcloud: "soundcloud.com/lunamix"
    },
    isOnline: true,
    audioMix: {
      title: "Ethereal Barcelona Nights",
      duration: "5:33",
      genre: "Progressive Trance"
    }
  }
];

const Community = () => {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState('gigs');
  const [currentDJIndex, setCurrentDJIndex] = useState(0);
  const [matches, setMatches] = useState<number[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentDJ = mockDJs[currentDJIndex];

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const handleSwipeLeft = () => {
    if (currentDJIndex < mockDJs.length - 1) {
      setCurrentDJIndex(currentDJIndex + 1);
    } else {
      setCurrentDJIndex(0);
    }
  };

  const handleSwipeRight = () => {
    setMatches([...matches, currentDJ.id]);
    handleSwipeLeft();
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleSwipeLeft(); // Pass
    }
    if (isRightSwipe) {
      handleSwipeRight(); // Connect
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate('/feed')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <button onClick={() => navigate('/')} className="flex items-center ml-4">
              <img 
                src={rhoodLogo} 
                alt="R/HOOD Logo" 
                className="w-8 h-8 mr-2"
              />
              <h1 className="text-xl font-bold text-foreground">Community</h1>
            </button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto">
        {/* Tab Switcher */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger value="gigs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Swipe for Gigs
            </TabsTrigger>
            <TabsTrigger value="connect" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Swipe to Connect
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gigs" className="mt-6">
            <div className="text-center py-8">
              <Music className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Gig Mode</h3>
              <p className="text-muted-foreground mb-4">
                Swipe through available gigs and opportunities
              </p>
              <Button variant="premium" onClick={() => navigate('/feed')}>
                Start Swiping Gigs
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="connect" className="mt-6">
            {/* DJ Profile Card */}
            <Card 
              className="bg-black border-primary/30 mb-6 relative overflow-hidden h-[480px] transition-transform duration-200 hover:scale-[1.02] select-none"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {/* Full Background Image */}
              <div className="absolute inset-0">
                <img 
                  src={currentDJ.profileImage} 
                  alt={currentDJ.name}
                  className="w-full h-full object-cover"
                />
                {/* Dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
              </div>

              {/* Online Status & Gigs Badge */}
              <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
                {currentDJ.isOnline && (
                  <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                )}
                <Badge variant="outline" className="bg-black/60 backdrop-blur text-white border-primary/50">
                  {currentDJ.totalGigs} gigs
                </Badge>
              </div>
              
              <CardContent className="relative z-10 p-6 h-full flex flex-col justify-end">
                {/* Profile Info at Bottom */}
                <div className="space-y-4">
                  {/* Name and Username */}
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-1">{currentDJ.name}</h2>
                    <p className="text-white/80 text-lg">{currentDJ.username}</p>
                  </div>

                  {/* Location & Rating */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-white/90">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{currentDJ.location}</span>
                    </div>
                    <div className="flex items-center text-primary">
                      <Star className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">{currentDJ.rating}</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-white/90 leading-relaxed">{currentDJ.bio}</p>

                  {/* Genres */}
                  <div className="flex flex-wrap gap-2">
                    {currentDJ.genres.map((genre) => (
                      <Badge key={genre} variant="outline" className="bg-black/40 backdrop-blur border-primary/50 text-white">
                        {genre}
                      </Badge>
                    ))}
                  </div>

                  {/* Audio Mix */}
                  <div className="bg-black/40 backdrop-blur rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-white">{currentDJ.audioMix.title}</h4>
                        <p className="text-xs text-white/70">{currentDJ.audioMix.duration} • {currentDJ.audioMix.genre}</p>
                      </div>
                      <Button
                        variant="ghost" 
                        size="icon"
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="h-8 w-8 text-primary hover:bg-primary/20"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {/* Mini Waveform */}
                    <div className="flex items-center space-x-1 h-4 mb-2">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1 bg-white/30 rounded-full transition-all duration-75 ${
                            isPlaying && i < 8 ? 'bg-primary' : ''
                          }`}
                          style={{ 
                            height: `${Math.random() * 80 + 20}%`,
                            animationDelay: isPlaying ? `${i * 80}ms` : '0ms'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="flex space-x-4">
                    <div className="flex items-center text-pink-400">
                      <Instagram className="h-4 w-4 mr-1" />
                      <span className="text-xs text-white/80">{currentDJ.socialLinks.instagram}</span>
                    </div>
                    <div className="flex items-center text-orange-400">
                      <Cloud className="h-4 w-4 mr-1" />
                      <span className="text-xs text-white/80">SoundCloud</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-8 mb-6">
              <Button
                variant="outline"
                className="w-16 h-12 rounded-2xl border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center"
                onClick={handleSwipeLeft}
              >
                <X className="h-6 w-6" />
              </Button>
              
              <Button
                variant="accent"
                className="w-16 h-12 rounded-2xl flex items-center justify-center"
                onClick={handleSwipeRight}
              >
                <Heart className="h-6 w-6" />
              </Button>
            </div>

            {/* Instructions */}
            <p className="text-center text-muted-foreground mb-6">
              Swipe right to connect • Swipe left to pass
            </p>

            {/* Matches Counter */}
            {matches.length > 0 && (
              <div className="text-center mb-4">
                <div className="inline-flex items-center bg-secondary rounded-full px-4 py-2">
                  <Users className="h-4 w-4 text-accent mr-2" />
                  <span className="text-foreground font-medium">
                    {matches.length} new connection{matches.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            )}

            {/* Matches List */}
            {matches.length > 0 && (
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground mb-3 flex items-center">
                    <Zap className="h-4 w-4 text-primary mr-2" />
                    Your Matches
                  </h3>
                  <div className="space-y-3">
                    {matches.map((matchId) => {
                      const matchedDJ = mockDJs.find(dj => dj.id === matchId);
                      if (!matchedDJ) return null;
                      
                      return (
                        <div key={matchId} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full mr-3 overflow-hidden ring-1 ring-primary/20">
                              <img 
                                src={matchedDJ.profileImage} 
                                alt={matchedDJ.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{matchedDJ.name}</p>
                              <p className="text-xs text-muted-foreground">{matchedDJ.location}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="premium"
                            onClick={() => navigate(`/messages?dj=${matchedDJ.id}`)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            DM
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;