# Connections Tab - Tinder-like Swipable Interface Instructions

## Overview
Convert the connections tab into a fully swipable card interface where users can swipe through potential connections, similar to the opportunities tab.

## Required Imports
```tsx
import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MapPin, Music, Users, Headphones } from "lucide-react";
```

## Data Interface
```tsx
interface Connection {
  id: string;
  name: string;
  profileImage: string;
  bio: string;
  location: string;
  genre: string;
  followers: string;
  status: "online" | "offline";
  mutualConnections: number;
  role: string; // "DJ", "Producer", "Fan", etc.
  experience: string; // "Beginner", "Intermediate", "Professional"
  instruments?: string[];
  recentActivity: string;
}
```

## State Management
Add these state variables to your component:

```tsx
// Connection swipe state
const [currentConnectionIndex, setCurrentConnectionIndex] = useState(0);
const [connectionsLeft, setConnectionsLeft] = useState(10);
const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
const [isDragging, setIsDragging] = useState(false);
const [isAnimating, setIsAnimating] = useState(false);

// Refs for drag handling
const cardRef = useRef<HTMLDivElement>(null);
const startPos = useRef({ x: 0, y: 0 });
const dragStarted = useRef(false);
```

## Current and Next Connection Logic
```tsx
const currentConnection = mockConnections[currentConnectionIndex];
const nextConnection = mockConnections[currentConnectionIndex + 1];
const hasMoreConnections = currentConnectionIndex < mockConnections.length - 1;
```

## Drag Event Handlers
```tsx
// Touch events
const onTouchStart = useCallback((e: React.TouchEvent) => {
  if (isAnimating) return;
  const touch = e.touches[0];
  startPos.current = { x: touch.clientX, y: touch.clientY };
  setIsDragging(true);
  dragStarted.current = true;
}, [isAnimating]);

const onTouchMove = useCallback((e: React.TouchEvent) => {
  if (!isDragging || !dragStarted.current || isAnimating) return;
  e.preventDefault();
  const touch = e.touches[0];
  const deltaX = touch.clientX - startPos.current.x;
  const deltaY = touch.clientY - startPos.current.y;
  setDragOffset({ x: deltaX, y: deltaY });
}, [isDragging, isAnimating]);

const onTouchEnd = useCallback(() => {
  if (!isDragging || isAnimating) return;
  setIsDragging(false);
  dragStarted.current = false;

  const threshold = 100;
  if (Math.abs(dragOffset.x) > threshold) {
    if (dragOffset.x > 0) {
      handleSwipeRight();
    } else {
      handleSwipeLeft();
    }
  } else {
    setDragOffset({ x: 0, y: 0 });
  }
}, [dragOffset, isDragging, isAnimating]);

// Mouse events (for desktop)
const onMouseDown = useCallback((e: React.MouseEvent) => {
  if (isAnimating) return;
  startPos.current = { x: e.clientX, y: e.clientY };
  setIsDragging(true);
  dragStarted.current = true;

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragStarted.current || isAnimating) return;
    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseUp = () => {
    if (!isDragging || isAnimating) return;
    setIsDragging(false);
    dragStarted.current = false;

    const threshold = 100;
    if (Math.abs(dragOffset.x) > threshold) {
      if (dragOffset.x > 0) {
        handleSwipeRight();
      } else {
        handleSwipeLeft();
      }
    } else {
      setDragOffset({ x: 0, y: 0 });
    }

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
}, [dragOffset, isDragging, isAnimating]);
```

## Swipe Action Handlers
```tsx
const handleSwipeLeft = useCallback(() => {
  if (isAnimating || !hasMoreConnections) return;
  
  setIsAnimating(true);
  setDragOffset({ x: -400, y: 0 });
  
  setTimeout(() => {
    setCurrentConnectionIndex(prev => prev + 1);
    setDragOffset({ x: 0, y: 0 });
    setIsAnimating(false);
  }, 300);
}, [isAnimating, hasMoreConnections]);

const handleSwipeRight = useCallback(() => {
  if (isAnimating || !hasMoreConnections || connectionsLeft === 0) return;
  
  setIsAnimating(true);
  setDragOffset({ x: 400, y: 0 });
  
  setTimeout(() => {
    setCurrentConnectionIndex(prev => prev + 1);
    setConnectionsLeft(prev => prev - 1);
    setDragOffset({ x: 0, y: 0 });
    setIsAnimating(false);
    // Show success toast
    toast({
      title: "Connection sent! 🤝",
      description: `Your connection request was sent to ${currentConnection.name}`,
    });
  }, 300);
}, [isAnimating, hasMoreConnections, connectionsLeft, currentConnection]);
```

## Card Animation Styles
```tsx
const cardStyle: React.CSSProperties = {
  transform: `translateX(${dragOffset.x}px) translateY(${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`,
  transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  opacity: Math.max(0.7, 1 - Math.abs(dragOffset.x) / 300),
};
```

## Complete Connections Component Structure
```tsx
const renderConnections = () => {
  if (!hasMoreConnections) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-8">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <Users className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">That's everyone!</h3>
        <p className="text-muted-foreground mb-6">
          You've seen all available connections. Check back later for new people to connect with.
        </p>
        <Button onClick={() => setCurrentConnectionIndex(0)} className="bg-primary hover:bg-primary/90">
          Start Over
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-200px)]">
      <div className="flex-1 flex items-center justify-center p-4">
        {/* Card Stack Container */}
        <div className="relative w-full max-w-sm mx-auto" style={{ height: '600px' }}>
          {/* Next Card (background) */}
          {nextConnection && (
            <Card className="absolute inset-0 bg-black border-border/50 overflow-hidden backdrop-blur-sm z-10 scale-95 opacity-50">
              <div className="relative w-full h-full">
                <img 
                  src={nextConnection.profileImage} 
                  alt={nextConnection.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                
                {/* Role Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <Badge variant="outline" className="bg-black/60 backdrop-blur text-white border-primary/50">
                    {nextConnection.role}
                  </Badge>
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
                  <h2 className="text-xl font-bold text-white mb-2">{nextConnection.name}</h2>
                  <div className="flex items-center text-white">
                    <MapPin className="h-4 w-4 mr-3 text-primary" />
                    <span className="text-sm font-medium">{nextConnection.location}</span>
                  </div>
                  <div className="flex items-center text-white">
                    <Music className="h-4 w-4 mr-3 text-primary" />
                    <span className="text-sm font-medium">{nextConnection.genre}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

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
                    CONNECT
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
                src={currentConnection.profileImage} 
                alt={currentConnection.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              
              {/* Status Indicator */}
              {currentConnection.status === "online" && (
                <div className="absolute top-4 left-4 z-10">
                  <div className="flex items-center bg-green-500/90 backdrop-blur text-white px-3 py-1 rounded-full text-xs font-medium">
                    <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                    Online
                  </div>
                </div>
              )}

              {/* Role Badge */}
              <div className="absolute top-4 right-4 z-10">
                <Badge variant="outline" className="bg-black/60 backdrop-blur text-white border-primary/50">
                  {currentConnection.role}
                </Badge>
              </div>

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{currentConnection.name}</h2>
                  <p className="text-sm text-gray-300 mb-4 leading-relaxed line-clamp-2">{currentConnection.bio}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-white">
                    <MapPin className="h-4 w-4 mr-3 text-primary" />
                    <span className="text-sm font-medium">{currentConnection.location}</span>
                  </div>
                  
                  <div className="flex items-center text-white">
                    <Music className="h-4 w-4 mr-3 text-primary" />
                    <span className="text-sm font-medium">{currentConnection.genre}</span>
                  </div>
                  
                  <div className="flex items-center text-white">
                    <Headphones className="h-4 w-4 mr-3 text-primary" />
                    <span className="text-sm font-medium">{currentConnection.followers} followers</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/20">
                    <Badge variant="secondary" className="bg-white/20 text-white backdrop-blur">
                      {currentConnection.experience}
                    </Badge>
                    <span className="text-sm text-gray-300 font-medium">
                      {currentConnection.mutualConnections} mutual connections
                    </span>
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
            disabled={connectionsLeft === 0 || isAnimating}
          >
            <Heart className="h-6 w-6" />
          </Button>
        </div>

        {/* Instructions */}
        <p className="text-center text-muted-foreground/80 mb-6 text-sm font-medium">
          Swipe left to pass • Swipe right to connect
        </p>

        {/* Connections Counter */}
        <div className="text-center">
          <div className="inline-flex items-center bg-black/40 backdrop-blur border border-primary/20 rounded-full px-6 py-3">
            <div className="w-2 h-2 bg-primary rounded-full mr-3 animate-pulse"></div>
            <span className="text-foreground font-semibold text-sm">
              {connectionsLeft} connections remaining today
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Key Features Implemented:
1. **Full-screen card experience** with profile images covering the entire card
2. **Stacked cards** showing current and next connection
3. **Touch and mouse drag support** for desktop and mobile
4. **Real-time drag feedback** with rotation and opacity changes
5. **Visual swipe indicators** (CONNECT/PASS) that appear during drag
6. **Action buttons** for users who prefer clicking over swiping
7. **Connection counter** limiting daily connections
8. **Online status indicators** and role badges
9. **Smooth animations** and transitions
10. **End state handling** when no more connections are available

## Color Scheme Notes:
- Uses semantic tokens from the design system (`--primary`, `--foreground`, etc.)
- All colors are HSL-based following the brand guidelines
- Maintains the dark, premium aesthetic with lime/green accents
- Proper contrast for readability with gradient overlays

This creates a fully immersive, Tinder-like experience for browsing and connecting with other users in the music community.