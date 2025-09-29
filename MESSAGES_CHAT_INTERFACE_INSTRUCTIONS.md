# Messages Chat Interface Rebuild Instructions

## Overview

The Messages component handles both group forum discussions and direct messaging with DJs. It switches between interfaces based on URL parameters and provides real-time-like chat functionality.

## Required Imports

```tsx
import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Phone,
  Video,
  Music,
  MapPin,
  Star,
  Users,
  Pin,
  Heart,
  MessageSquare,
  ThumbsUp,
} from "lucide-react";
import rhoodLogo from "@/assets/rhood-logo.png";
import person1 from "@/assets/person1.jpg";
import person2 from "@/assets/person2.jpg";
import alexProfile from "@/assets/alex-profile.jpg";
```

## Mock Data Structures

### DJ Data

```tsx
const mockDJs = [
  {
    id: 1,
    name: "Maya Rodriguez",
    username: "@mayabeats",
    location: "Berlin, Germany",
    genres: ["House", "Techno", "Progressive"],
    rating: 4.9,
    profileImage: person1,
    isOnline: true,
  },
  {
    id: 2,
    name: "Kai Johnson",
    username: "@djkai",
    location: "Amsterdam, Netherlands",
    genres: ["Drum & Bass", "Breakbeat", "Electronic"],
    rating: 4.7,
    profileImage: person2,
    isOnline: false,
  },
];
```

### Forum Posts Data

```tsx
const mockForumPosts = [
  {
    id: 1,
    author: "Sofia Rodriguez",
    username: "@sofiavibes",
    avatar: person2,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    content:
      "Just finished an incredible set at Fabric last night! The crowd was absolutely electric ⚡ Anyone else perform this weekend?",
    likes: 24,
    replies: 8,
    isPinned: true,
    tags: ["fabric", "weekend-sets"],
  },
  // ... additional posts
];
```

### Messages Data

```tsx
const mockMessages = [
  {
    id: 1,
    senderId: 1,
    text: "Hey! I saw your profile and love your sound. Are you available for a collaboration this weekend?",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isCurrentUser: false,
  },
  // ... additional messages
];
```

## Component State Management

```tsx
const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const djId = parseInt(searchParams.get('dj') || '1');
  const isGroupChat = searchParams.get('group') === 'rhood';
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  const [newPost, setNewPost] = useState('');
  const [forumPosts, setForumPosts] = useState(mockForumPosts);

  const currentDJ = mockDJs.find(dj => dj.id === djId) || mockDJs[0];
```

## Utility Functions

### Time Formatting

```tsx
const formatTime = (date: Date) => {
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) {
    const diffInMins = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );
    return `${diffInMins}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  }
};
```

### Event Handlers

```tsx
const handleSendMessage = () => {
  if (!newMessage.trim()) return;

  const message = {
    id: messages.length + 1,
    senderId: "current",
    text: newMessage,
    timestamp: new Date(),
    isCurrentUser: true,
  };

  setMessages([...messages, message]);
  setNewMessage("");
};

const handlePostToForum = () => {
  if (!newPost.trim()) return;

  const post = {
    id: forumPosts.length + 1,
    author: "Alex Thompson",
    username: "@alexunderground",
    avatar: alexProfile,
    timestamp: new Date(),
    content: newPost,
    likes: 0,
    replies: 0,
    isPinned: false,
    tags: [],
  };

  setForumPosts([post, ...forumPosts]);
  setNewPost("");
};

const handleKeyPress = (e: React.KeyboardEvent) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (isGroupChat) {
      handlePostToForum();
    } else {
      handleSendMessage();
    }
  }
};
```

## Group Forum Interface

### Layout Structure

```tsx
const renderGroupForum = () => (
  <div className="min-h-screen bg-gradient-dark flex flex-col">
    {/* Header */}
    <div className="bg-card border-b border-border p-4 flex-shrink-0">
      {/* Header content */}
    </div>

    {/* Forum Posts */}
    <div className="flex-1 overflow-y-auto p-4">{/* Posts list */}</div>

    {/* New Post Input */}
    <div className="p-4 bg-card border-t border-border flex-shrink-0">
      {/* Input form */}
    </div>
  </div>
);
```

### Forum Header

```tsx
<div className="flex items-center justify-between max-w-md mx-auto">
  <div className="flex items-center flex-1">
    <Button variant="ghost" size="icon" onClick={() => navigate("/feed")}>
      <ArrowLeft className="h-5 w-5" />
    </Button>

    <div className="flex items-center ml-3 flex-1">
      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
        <Users className="h-5 w-5 text-primary-foreground" />
      </div>

      <div className="ml-3 flex-1">
        <h2 className="font-semibold text-foreground text-sm">R/HOOD Group</h2>
        <div className="flex items-center text-xs text-muted-foreground">
          <span>12 members • Community Forum</span>
        </div>
      </div>
    </div>
  </div>

  <div className="flex items-center space-x-2">
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </div>
</div>
```

### Forum Post Card

```tsx
<Card key={post.id} className="bg-card border-border/50">
  <CardContent className="p-4">
    {/* Post Header */}
    <div className="flex items-start space-x-3 mb-3">
      <Avatar className="w-10 h-10">
        <AvatarImage src={post.avatar} alt={post.author} />
        <AvatarFallback>{post.author[0]}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-foreground text-sm">
            {post.author}
          </h3>
          {post.isPinned && <Pin className="h-3 w-3 text-primary" />}
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span>{post.username}</span>
          <span>•</span>
          <span>{formatTime(post.timestamp)}</span>
        </div>
      </div>
    </div>

    {/* Post Content */}
    <p className="text-sm text-foreground leading-relaxed mb-3">
      {post.content}
    </p>

    {/* Tags */}
    {post.tags.length > 0 && (
      <div className="flex flex-wrap gap-1 mb-3">
        {post.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            #{tag}
          </Badge>
        ))}
      </div>
    )}

    {/* Post Actions */}
    <div className="flex items-center space-x-6 pt-2 border-t border-border/50">
      <button className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors">
        <ThumbsUp className="h-4 w-4" />
        <span className="text-xs">{post.likes}</span>
      </button>
      <button className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors">
        <MessageSquare className="h-4 w-4" />
        <span className="text-xs">{post.replies}</span>
      </button>
    </div>
  </CardContent>
</Card>
```

## Direct Message Interface

### DM Header

```tsx
<div className="bg-card border-b border-border p-4 flex-shrink-0">
  <div className="flex items-center justify-between max-w-md mx-auto">
    <div className="flex items-center flex-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/community")}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <div className="flex items-center ml-3 flex-1">
        <div className="relative">
          <img
            src={currentDJ.profileImage}
            alt={currentDJ.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
          />
          {currentDJ.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full border-2 border-card"></div>
          )}
        </div>

        <div className="ml-3 flex-1">
          <h2 className="font-semibold text-foreground text-sm">
            {currentDJ.name}
          </h2>
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 mr-1" />
            <span>{currentDJ.location}</span>
            <Star className="h-3 w-3 ml-2 mr-1" />
            <span>{currentDJ.rating}</span>
          </div>
        </div>
      </div>
    </div>

    <div className="flex items-center space-x-2">
      <Button variant="ghost" size="icon">
        <Phone className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <Video className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </div>
  </div>
</div>
```

### DJ Info Card

```tsx
<div className="p-4 flex-shrink-0">
  <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 max-w-md mx-auto">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Music className="h-4 w-4 text-primary mr-2" />
          <span className="text-sm font-medium text-foreground">
            DJ Profile
          </span>
        </div>
        <Badge variant="outline" className="border-primary/50 text-primary">
          Connected
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1">
        {currentDJ.genres.map((genre) => (
          <Badge key={genre} variant="secondary" className="text-xs">
            {genre}
          </Badge>
        ))}
      </div>
    </CardContent>
  </Card>
</div>
```

### Message Bubbles

```tsx
{
  messages.map((message) => (
    <div
      key={message.id}
      className={`flex ${
        message.isCurrentUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          message.isCurrentUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-secondary text-secondary-foreground rounded-bl-md"
        }`}
      >
        <p className="text-sm leading-relaxed">{message.text}</p>
        <p
          className={`text-xs mt-1 ${
            message.isCurrentUser
              ? "text-primary-foreground/70"
              : "text-muted-foreground"
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  ));
}
```

## Input Components

### Message/Post Input

```tsx
<div className="p-4 bg-card border-t border-border flex-shrink-0">
  <div className="max-w-md mx-auto">
    <div className="flex items-end space-x-2">
      <div className="flex-1">
        <Input
          value={isGroupChat ? newPost : newMessage}
          onChange={(e) =>
            isGroupChat
              ? setNewPost(e.target.value)
              : setNewMessage(e.target.value)
          }
          onKeyPress={handleKeyPress}
          placeholder={
            isGroupChat ? "Share with the community..." : "Type a message..."
          }
          className="resize-none bg-secondary border-secondary-foreground/20 focus:border-primary"
        />
      </div>
      <Button
        onClick={isGroupChat ? handlePostToForum : handleSendMessage}
        disabled={isGroupChat ? !newPost.trim() : !newMessage.trim()}
        className="px-4 py-2 bg-primary hover:bg-primary/90"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  </div>
</div>
```

## Main Component Logic

```tsx
const Messages = () => {
  // ... state and handlers

  if (isGroupChat) {
    return renderGroupForum();
  }

  return renderDirectMessage();
};

export default Messages;
```

## Key Features

- **Responsive Design**: Maximum width of 400px (max-w-md) centered on larger screens
- **URL Parameters**: Uses `?group=rhood` for forum, `?dj=1` for direct messages
- **Real-time Style**: Immediate message/post addition with optimistic updates
- **Online Status**: Green dot indicator for online DJs
- **Message Bubbles**: Different styling for sent vs received messages
- **Post Interactions**: Like and reply counts with hover effects
- **Pinned Posts**: Special pin icon for important forum posts
- **Genre Tags**: Badge system for DJ genres and post tags
- **Enter to Send**: Keyboard shortcut for sending messages/posts
- **Empty State Protection**: Buttons disabled when input is empty

## Styling Notes

- Uses semantic color tokens (primary, secondary, card, border, etc.)
- Gradient background: `bg-gradient-dark`
- Message bubbles have rounded corners with slight modifications (rounded-br-md, rounded-bl-md)
- Hover effects on interactive elements
- Proper spacing and typography hierarchy
- Border opacity variations for subtle visual depth
