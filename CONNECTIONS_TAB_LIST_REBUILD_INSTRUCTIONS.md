# Connections Tab - List Interface Rebuild Instructions

## Overview
The connections tab displays a chat-like list interface with a pinned group chat, individual connections, and a call-to-action section.

## Required Imports
```tsx
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck } from 'lucide-react';
```

## Data Structure
```tsx
interface Connection {
  id: number;
  name: string;
  username: string;
  location: string;
  genres: string[];
  profileImage: string;
  rating: number;
  gigsCompleted: number;
  lastActive: string;
  mutualConnections: number;
  status: "online" | "recently_active" | "offline";
}

// Mock data example
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
```

## Complete Connections Component
```tsx
const renderConnections = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md mx-auto">
        {/* Pinned Group Chat Section */}
        <div className="bg-card border-b border-border/50 p-4 sticky top-0 z-10">
          <div 
            className="flex items-center space-x-3 cursor-pointer" 
            onClick={() => navigate('/messages?group=rhood')}
          >
            {/* Group Avatar */}
            <div className="relative">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              {/* Online Status Indicator */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card"></div>
            </div>
            
            {/* Group Chat Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">R/HOOD Group</h3>
                <span className="text-xs text-muted-foreground">2m</span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                Sofia: Yeah, the set was amazing! 🔥
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                  Pinned
                </Badge>
                <span className="text-xs text-muted-foreground">12 members</span>
              </div>
            </div>
            
            {/* Unread Messages Counter */}
            <div className="flex flex-col items-end">
              <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <span className="text-xs text-primary-foreground font-medium">3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Individual Connections List */}
        <div className="divide-y divide-border/50">
          {mockConnections.map((connection) => (
            <div 
              key={connection.id} 
              className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
              onClick={() => navigate('/messages')}
            >
              <div className="flex items-center space-x-3">
                {/* Profile Image with Online Status */}
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
                
                {/* Connection Info */}
                <div className="flex-1 min-w-0">
                  {/* Name and Last Active Time */}
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground truncate">
                      {connection.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {connection.lastActive}
                    </span>
                  </div>
                  
                  {/* Last Message Preview */}
                  <p className="text-sm text-muted-foreground truncate">
                    {connection.id === 1 && "Hey! Are you free for that gig next week?"}
                    {connection.id === 2 && "Thanks for the connection! Let's collaborate soon"}
                    {connection.id === 3 && "That drum & bass set was incredible! 🎵"}
                  </p>
                  
                  {/* Genre Tags */}
                  <div className="flex items-center space-x-2 mt-1">
                    {connection.genres.slice(0, 2).map((genre) => (
                      <Badge key={genre} variant="secondary" className="text-xs">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Unread Message Indicator */}
                {connection.id === 1 && (
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Add Connection Call-to-Action */}
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
};
```

## Key Design Features:

### 1. **Sticky Pinned Group Chat**
- Fixed at top with `sticky top-0 z-10`
- Group avatar with Users icon in primary color circle
- Online status indicator (green dot)
- Unread message counter badge
- Recent message preview

### 2. **Connection List Items**
- Hover effect with `hover:bg-secondary/50`
- Profile images with online status indicators
- Name and last active time in header row
- Message preview with different content per user
- Genre badges (max 2 shown)
- Unread indicator dot for active conversations

### 3. **Call-to-Action Section**
- Separated with border-top
- Centered layout with icon, heading, description
- Browse Community button to navigate to `/community`
- Subtle background styling with `bg-secondary/30`

### 4. **Interactive Elements**
- Clickable group chat navigates to `/messages?group=rhood`
- Individual connections navigate to `/messages`
- CTA button navigates to `/community`
- Hover states for better UX

### 5. **Layout Structure**
- Full-height container with `min-h-[calc(100vh-200px)]`
- Centered max-width container (`max-w-md mx-auto`)
- Proper spacing and dividers between sections
- Mobile-first responsive design

### 6. **Status Indicators**
- Green dots for online status
- Primary colored unread message counters
- Badge styling for pinned group and genres
- Different message previews per connection

## Color Scheme Notes:
- Uses semantic design tokens (`--primary`, `--foreground`, `--muted-foreground`)
- All colors follow HSL format from brand guidelines
- Proper contrast with dark background theme
- Green status indicators for online presence
- Primary color accents for important elements

This creates a clean, chat-like interface that feels familiar to users while maintaining the R/HOOD brand aesthetic with proper dark theme styling and lime/green accent colors.