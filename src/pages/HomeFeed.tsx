import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BottomNavigation } from '@/components/ui/bottom-navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  MessageCircle, 
  Heart, 
  X, 
  User, 
  Bell, 
  Users,
  ArrowLeft,
  ArrowRight,
  Settings,
  Briefcase,
  UserCheck,
  Play,
  Pause,
  Music,
  Volume2,
  Menu
} from 'lucide-react';

// Import hero images
import warehouseRave from '@/assets/warehouse-rave.jpg';
import rooftopSessions from '@/assets/rooftop-sessions.jpg';
import clubResidency from '@/assets/club-residency.jpg';
import beachFestival from '@/assets/beach-festival.jpg';
import sunsetFestival from '@/assets/sunset-festival.jpg';
import neonClub from '@/assets/neon-club.jpg';
import skybarNight from '@/assets/skybar-night.jpg';
import rhoodLogo from '@/assets/rhood-logo.png';
import person1 from '@/assets/person1.jpg';
import person2 from '@/assets/person2.jpg';
import alexProfile from '@/assets/alex-profile.jpg';

const mockGigs = [
  {
    id: 1,
    name: "Underground Warehouse Rave",
    date: "2024-08-15",
    time: "22:00",
    location: "East London",
    fee: "£300",
    description: "High-energy underground event. Looking for DJs who can bring the heat with hard techno and industrial beats.",
    genre: "Techno",
    skillLevel: "Intermediate",
    organizer: "Darkside Collective",
    heroImage: warehouseRave
  },
  {
    id: 2,
    name: "Rooftop Summer Sessions",
    date: "2024-08-20",
    time: "18:00",
    location: "Shoreditch",
    fee: "£450",
    description: "Beautiful rooftop venue overlooking the city. Perfect for deep house and progressive sets as the sun goes down.",
    genre: "House",
    skillLevel: "Professional",
    organizer: "Vista Events",
    heroImage: rooftopSessions
  },
  {
    id: 3,
    name: "Club Residency Audition",
    date: "2024-08-25",
    time: "20:00",
    location: "Camden",
    fee: "£200 + Residency",
    description: "Opportunity to become resident DJ at one of London's hottest underground clubs. This could be your break!",
    genre: "Drum & Bass",
    skillLevel: "Professional",
    organizer: "Basement Club",
    heroImage: clubResidency
  },
  {
    id: 4,
    name: "Beach Festival Weekend",
    date: "2024-08-30",
    time: "14:00",
    location: "Brighton Beach",
    fee: "£600",
    description: "Three-day beach festival with thousands of attendees. Looking for versatile DJs who can read the crowd and keep the energy high.",
    genre: "Progressive House",
    skillLevel: "Professional",
    organizer: "Coastal Events",
    heroImage: beachFestival
  },
  {
    id: 5,
    name: "Sunset Open Air Festival",
    date: "2024-09-05",
    time: "16:00",
    location: "Hyde Park",
    fee: "£800",
    description: "Epic sunset festival in the heart of London. Prime slot for established DJs who can deliver an unforgettable set.",
    genre: "Trance",
    skillLevel: "Expert",
    organizer: "Festival Productions",
    heroImage: sunsetFestival
  },
  {
    id: 6,
    name: "Neon Underground Club Night",
    date: "2024-09-10",
    time: "23:00",
    location: "Kings Cross",
    fee: "£350",
    description: "Intimate underground club with cutting-edge sound system. Perfect for experimental electronic music and late-night vibes.",
    genre: "Experimental",
    skillLevel: "Intermediate",
    organizer: "Neon Collective",
    heroImage: neonClub
  }
];

const mockConnections = [
  {
    id: 1,
    name: "Marcus Chen",
    username: "@marcusbeats",
    location: "Shoreditch, London",
    genres: ["House", "Tech House"],
    profileImage: person1,
    rating: 4.9,
    gigsCompleted: 24,
    lastActive: "2 hours ago",
    mutualConnections: 3,
    status: "online"
  },
  {
    id: 2,
    name: "Sofia Rodriguez",
    username: "@sofiavibes",
    location: "Camden, London",
    genres: ["Techno", "Progressive"],
    profileImage: person2,
    rating: 4.7,
    gigsCompleted: 18,
    lastActive: "1 day ago",
    mutualConnections: 7,
    status: "recently_active"
  },
  {
    id: 3,
    name: "Alex Thompson",
    username: "@alexunderground",
    location: "Hackney, London",
    genres: ["Drum & Bass", "Jungle"],
    profileImage: alexProfile,
    rating: 4.8,
    gigsCompleted: 31,
    lastActive: "30 mins ago",
    mutualConnections: 2,
    status: "online"
  }
];

const mockMixes = [
  {
    id: 1,
    title: "Midnight Warehouse Vibes",
    artist: "DJ Marcus Chen",
    genre: "Techno",
    duration: "5:00",
    description: "Dark, pulsing techno perfect for late-night sessions",
    image: warehouseRave,
    audioUrl: "#", // Would be actual audio file
    plays: 1240,
    likes: 89
  },
  {
    id: 2,
    title: "Sunset Rooftop Sessions",
    artist: "Sofia Rodriguez",
    genre: "Deep House",
    duration: "5:00",
    description: "Smooth deep house for golden hour moments",
    image: rooftopSessions,
    audioUrl: "#",
    plays: 2100,
    likes: 156
  },
  {
    id: 3,
    title: "Underground Energy",
    artist: "Alex Thompson",
    genre: "Drum & Bass",
    duration: "5:00",
    description: "High-energy drum & bass to get your blood pumping",
    image: clubResidency,
    audioUrl: "#",
    plays: 890,
    likes: 67
  },
  {
    id: 4,
    title: "Beach Festival Highlights",
    artist: "Festival Pro",
    genre: "Progressive House",
    duration: "5:00",
    description: "Best moments from the summer beach festival",
    image: beachFestival,
    audioUrl: "#",
    plays: 3200,
    likes: 245
  },
  {
    id: 5,
    title: "Neon Night Experimental",
    artist: "Underground Collective",
    genre: "Experimental",
    duration: "5:00",
    description: "Pushing boundaries with experimental electronic sounds",
    image: neonClub,
    audioUrl: "#",
    plays: 650,
    likes: 42
  }
];

const HomeFeed = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('opportunities');
  const [currentGigIndex, setCurrentGigIndex] = useState(0);
  const [appliesLeft, setAppliesLeft] = useState(3);
  const [showApplication, setShowApplication] = useState(false);
  // Enhanced Tinder-like swipe state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [playingMixId, setPlayingMixId] = useState<number | null>(null);

  const currentGig = mockGigs[currentGigIndex];
  const nextGig = mockGigs[(currentGigIndex + 1) % mockGigs.length];

  const handleDragStart = (clientX: number, clientY: number) => {
    if (isAnimating) return;
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setDragOffset({ x: 0, y: 0 });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || isAnimating) return;
    
    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    
    // Limit vertical movement and emphasize horizontal
    setDragOffset({ 
      x: deltaX, 
      y: deltaY * 0.2 // Reduce vertical movement
    });
  };

  const handleDragEnd = () => {
    if (!isDragging || isAnimating) return;
    
    setIsDragging(false);
    setIsAnimating(true);
    
    const threshold = 100;
    const { x } = dragOffset;
    
    if (Math.abs(x) > threshold) {
      if (x > 0) {
        handleSwipeRight();
      } else {
        handleSwipeLeft();
      }
    } else {
      // Snap back
      setDragOffset({ x: 0, y: 0 });
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling while dragging
    handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
  };

  const onTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse events for desktop
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
    
    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    };
    
    const handleMouseUp = () => {
      handleDragEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSwipeLeft = () => {
    setDragOffset({ x: -400, y: -50 });
    setTimeout(() => {
      setCurrentGigIndex((prevIndex) => 
        prevIndex === mockGigs.length - 1 ? 0 : prevIndex + 1
      );
      setDragOffset({ x: 0, y: 0 });
      setIsAnimating(false);
    }, 300);
  };

  const handleSwipeRight = () => {
    if (appliesLeft > 0) {
      setDragOffset({ x: 400, y: -50 });
      setTimeout(() => {
        setShowApplication(true);
        setDragOffset({ x: 0, y: 0 });
        setIsAnimating(false);
      }, 300);
    } else {
      // Snap back if no applies left
      setDragOffset({ x: 0, y: 0 });
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const confirmApplication = () => {
    setAppliesLeft(appliesLeft - 1);
    setShowApplication(false);
    handleSwipeLeft(); // Move to next gig
  };

  const tabs = [
    {
      id: 'opportunities',
      label: 'Opportunities',
      icon: <Briefcase className="h-4 w-4" />
    },
    {
      id: 'connections',
      label: 'Connections',
      icon: <UserCheck className="h-4 w-4" />
    },
    {
      id: 'listen',
      label: 'Listen',
      icon: <Music className="h-4 w-4" />
    }
  ];

  const renderOpportunities = () => {
    // Calculate transform and style for current card
    const cardRotation = isDragging ? dragOffset.x * 0.1 : 0;
    const cardOpacity = isDragging ? 1 - Math.abs(dragOffset.x) * 0.001 : 1;
    
    const cardStyle = {
      transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${cardRotation}deg)`,
      opacity: Math.max(0.3, cardOpacity),
      transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    };

    // Style for the card underneath
    const nextCardStyle = {
      transform: `scale(${0.9 + Math.abs(dragOffset.x) * 0.0002}) translateY(10px)`,
      opacity: 0.8 + Math.abs(dragOffset.x) * 0.0005,
      transition: isDragging ? 'all 0.2s ease-out' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
        <div className="w-full max-w-sm relative">
          {/* Card Stack Container */}
          <div className="relative h-[400px] mb-6">
            {/* Next Card (underneath) */}
            <Card 
              className="absolute inset-0 bg-black border-border/30 overflow-hidden backdrop-blur-sm select-none pointer-events-none z-10"
              style={nextCardStyle}
            >
              <div className="relative w-full h-full">
                <img 
                  src={nextGig.heroImage} 
                  alt={nextGig.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                
                {/* Genre Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="outline" className="bg-black/60 backdrop-blur text-white border-primary/50">
                    {nextGig.genre}
                  </Badge>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
                  <h2 className="text-xl font-bold text-white mb-2">{nextGig.name}</h2>
                  <div className="flex items-center text-white">
                    <Calendar className="h-4 w-4 mr-3 text-primary" />
                    <span className="text-sm font-medium">{nextGig.date}</span>
                  </div>
                  <div className="flex items-center text-white">
                    <MapPin className="h-4 w-4 mr-3 text-primary" />
                    <span className="text-sm font-medium">{nextGig.location}</span>
                  </div>
                  <div className="flex items-center text-primary">
                    <DollarSign className="h-4 w-4 mr-3" />
                    <span className="text-xl font-bold">{nextGig.fee}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Current Card (top, draggable) */}
            <Card 
              className="absolute inset-0 bg-black border-border/50 overflow-hidden backdrop-blur-sm cursor-grab active:cursor-grabbing select-none z-20"
              style={cardStyle}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseDown={onMouseDown}
            >
              {/* Swipe Indicators */}
              {isDragging && (
                <>
                  {dragOffset.x > 50 && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-green-500/90 text-white px-6 py-3 rounded-lg font-bold text-lg rotate-12 animate-pulse">
                      APPLY
                    </div>
                  )}
                  {dragOffset.x < -50 && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-red-500/90 text-white px-6 py-3 rounded-lg font-bold text-lg -rotate-12 animate-pulse">
                      PASS
                    </div>
                  )}
                </>
              )}

              <div className="relative w-full h-full">
                <img 
                  src={currentGig.heroImage} 
                  alt={currentGig.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                
                {/* Genre Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="outline" className="bg-black/60 backdrop-blur text-white border-primary/50">
                    {currentGig.genre}
                  </Badge>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">{currentGig.name}</h2>
                    <p className="text-sm text-gray-300 mb-4 leading-relaxed line-clamp-2">{currentGig.description}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-white">
                      <Calendar className="h-4 w-4 mr-3 text-primary" />
                      <span className="text-sm font-medium">{currentGig.date} at {currentGig.time}</span>
                    </div>
                    
                    <div className="flex items-center text-white">
                      <MapPin className="h-4 w-4 mr-3 text-primary" />
                      <span className="text-sm font-medium">{currentGig.location}</span>
                    </div>
                    
                    <div className="flex items-center text-primary">
                      <DollarSign className="h-4 w-4 mr-3" />
                      <span className="text-xl font-bold">{currentGig.fee}</span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/20">
                      <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur">
                        {currentGig.skillLevel}
                      </Badge>
                      <span className="text-sm text-gray-300 font-medium">{currentGig.organizer}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-8 mb-8">
            <Button
              variant="outline"
              size="icon"
              className="w-14 h-14 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/70 hover:bg-red-500/20 hover:text-red-400 hover:border-red-400/50 transition-all duration-200 hover:scale-105"
              onClick={handleSwipeLeft}
              disabled={isAnimating}
            >
              <X className="h-6 w-6" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="w-14 h-14 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white/70 hover:bg-primary hover:text-black transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSwipeRight}
              disabled={appliesLeft === 0 || isAnimating}
            >
              <Heart className="h-6 w-6" />
            </Button>
          </div>

          {/* Instructions */}
          <p className="text-center text-muted-foreground/80 mb-6 text-sm font-medium">
            Swipe left to pass • Swipe right to apply
          </p>

          {/* Applies Counter */}
          <div className="text-center">
            <div className="inline-flex items-center bg-black/40 backdrop-blur border border-primary/20 rounded-full px-6 py-3">
              <div className="w-2 h-2 bg-primary rounded-full mr-3 animate-pulse"></div>
              <span className="text-foreground font-semibold text-sm">
                {appliesLeft} applies remaining today
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConnections = () => (
    <div className="flex flex-col min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md mx-auto">
        {/* Pinned Group Chat */}
        <div className="bg-card border-b border-border/50 p-4 sticky top-0 z-10">
          <div className="flex items-center space-x-3" onClick={() => navigate('/messages?group=rhood')}>
            <div className="relative">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card"></div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Rhood Group</h3>
                <span className="text-xs text-muted-foreground">2m</span>
              </div>
              <p className="text-sm text-muted-foreground truncate">Sofia: Yeah, the set was amazing! 🔥</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className="text-xs bg-primary/20 text-primary border-primary/30">Pinned</Badge>
                <span className="text-xs text-muted-foreground">12 members</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-medium">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Chats */}
        <div className="divide-y divide-border/50">
          {mockConnections.map((connection) => (
            <div 
              key={connection.id} 
              className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => navigate('/messages')}
            >
              <div className="flex items-center space-x-3">
                {/* Profile Image */}
                <div className="relative">
                  <img 
                    src={connection.profileImage} 
                    alt={connection.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {connection.status === "online" && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card"></div>
                  )}
                </div>
                
                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground truncate">{connection.name}</h3>
                    <span className="text-xs text-muted-foreground">{connection.lastActive}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {connection.id === 1 && "Hey! Are you free for that gig next week?"}
                    {connection.id === 2 && "Thanks for the connection! Let's collaborate soon"}
                    {connection.id === 3 && "That drum & bass set was incredible! 🎵"}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    {connection.genres.slice(0, 2).map((genre) => (
                      <Badge key={genre} variant="secondary" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Unread indicator */}
                {connection.id === 1 && (
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Add Connection CTA */}
        <div className="p-4 border-t border-border/50">
          <div className="text-center bg-secondary/30 rounded-lg p-4">
            <UserCheck className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
            <h3 className="font-medium text-foreground mb-1">Find More Connections</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Discover DJs and industry professionals
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/community')}
              className="bg-card border-border hover:bg-secondary"
            >
              Browse Community
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderListen = () => {
    const togglePlay = (mixId: number) => {
      if (playingMixId === mixId) {
        setPlayingMixId(null);
      } else {
        setPlayingMixId(mixId);
      }
    };

    return (
      <div className="flex flex-col min-h-[calc(100vh-200px)] p-4">
        <div className="w-full max-w-md mx-auto space-y-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">DJ Mixes</h2>
            <p className="text-muted-foreground">5-minute sets from top DJs</p>
          </div>

          {mockMixes.map((mix) => (
            <Card key={mix.id} className="bg-card border-border/50 overflow-hidden">
              <div className="flex">
                {/* Mix Image */}
                <div className="flex flex-col">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <img 
                      src={mix.image} 
                      alt={mix.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black/80"
                        onClick={() => togglePlay(mix.id)}
                      >
                        {playingMixId === mix.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4 ml-0.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-center">
                    <Badge 
                      variant="secondary" 
                      className="bg-primary/10 text-primary border-primary/20 text-xs px-2 py-1 font-medium"
                    >
                      {mix.genre}
                    </Badge>
                  </div>
                </div>

                {/* Mix Info */}
                <CardContent className="flex-1 p-4">
                  <div className="mb-2">
                    <h3 className="font-semibold text-foreground truncate text-base">{mix.title}</h3>
                    <button 
                      className="text-sm text-primary hover:text-primary/80 transition-colors truncate text-left font-medium"
                      onClick={() => navigate('/profile')}
                    >
                      {mix.artist}
                    </button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                    {mix.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center">
                        <Volume2 className="h-3 w-3 mr-1" />
                        {mix.plays.toLocaleString()}
                      </span>
                      <span className="flex items-center">
                        <Heart className="h-3 w-3 mr-1" />
                        {mix.likes}
                      </span>
                    </div>
                    <span className="font-medium">{mix.duration}</span>
                  </div>
                  
                  {/* Progress bar (simulated) */}
                  {playingMixId === mix.id && (
                    <div className="mt-3">
                      <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full animate-pulse" 
                          style={{ width: '30%' }}
                        ></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
            </Card>
          ))}
          
          {/* Upload CTA */}
          <div className="text-center bg-secondary/30 rounded-lg p-6 mt-6">
            <Music className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Share Your Mix</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your 5-minute DJ set and get discovered
            </p>
            <Button variant="outline" className="bg-card border-border hover:bg-secondary">
              Upload Mix
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-dark pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button onClick={() => navigate('/')} className="flex items-center">
            <img 
              src={rhoodLogo} 
              alt="R/HOOD Logo" 
              className="w-10 h-10 mr-3"
            />
            <h1 className="text-xl font-black text-foreground tracking-wide">R/HOOD</h1>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
              <DropdownMenuItem onClick={() => navigate('/notifications')} className="cursor-pointer">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/community')} className="cursor-pointer">
                <Users className="h-4 w-4 mr-2" />
                Community
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'opportunities' && renderOpportunities()}
      {activeTab === 'connections' && renderConnections()}
      {activeTab === 'listen' && renderListen()}

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
      />

      {/* Application Confirmation Dialog */}
      <Dialog open={showApplication} onOpenChange={setShowApplication}>
        <DialogContent className="bg-card border-border max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Apply to {currentGig.name}?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to apply to this gig? This will use one of your daily applies.
            </p>
            <div className="bg-secondary p-4 rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Your Profile Preview:</h4>
              <div className="text-sm space-y-1">
                <p className="text-foreground">DJ Alex Thompson</p>
                <p className="text-muted-foreground">Techno • House • London</p>
                <p className="text-muted-foreground">4.8★ rating • 12 gigs completed</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="premium" className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground border border-border" onClick={() => setShowApplication(false)}>
                Cancel
              </Button>
              <Button variant="premium" className="flex-1" onClick={confirmApplication}>
                Apply Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomeFeed;