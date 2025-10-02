"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Send,
  Users,
  Settings,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  MessageSquare,
  Pin,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { textStyles } from "@/lib/typography";
import Image from "next/image";

interface Community {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  member_count: number | null;
  created_at: string | null;
  created_by: string | null;
  creator_name?: string;
  creator_avatar?: string | null;
}

interface Message {
  id: string;
  content: string;
  created_at: string | null;
  sender_id: string | null;
  sender_name?: string;
  sender_avatar?: string | null;
  is_pinned?: boolean;
}

interface Member {
  id: string;
  user_id: string | null;
  role: string | null;
  joined_at: string | null;
  user_name?: string;
  user_avatar?: string | null;
}

export default function CommunityDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [community, setCommunity] = useState<Community | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [communityId, setCommunityId] = useState<string | null>(null);

  // Fetch community details
  const fetchCommunity = useCallback(async () => {
    if (!communityId) return;

    try {
      const { data, error } = await supabase
        .from("communities")
        .select(
          `
          *,
          creator:user_profiles!communities_created_by_fkey(
            id,
            first_name,
            last_name,
            profile_image_url
          )
        `
        )
        .eq("id", communityId)
        .single();

      if (error) {
        console.error("Error fetching community:", error);
        toast({
          title: "Error",
          description: "Failed to fetch community details",
          variant: "destructive",
        });
        return;
      }

      const transformedCommunity = {
        ...data,
        creator_name: data.creator
          ? `${data.creator.first_name} ${data.creator.last_name}`
          : "Unknown",
        creator_avatar: data.creator?.profile_image_url || null,
      };

      setCommunity(transformedCommunity);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }, [communityId, toast]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!communityId) return;

    try {
      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:user_profiles!messages_sender_id_fkey(
            id,
            first_name,
            last_name,
            profile_image_url
          )
        `
        )
        .eq("community_id", communityId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      const transformedMessages =
        data?.map((message) => ({
          ...message,
          sender_name: message.sender
            ? `${message.sender.first_name} ${message.sender.last_name}`
            : "Unknown",
          sender_avatar: message.sender?.profile_image_url || null,
        })) || [];

      setMessages(transformedMessages);
    } catch (error) {
      console.error("Error:", error);
    }
  }, [communityId]);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    if (!communityId) return;

    try {
      const { data, error } = await supabase
        .from("community_members")
        .select(
          `
          *,
          user:user_profiles!community_members_user_id_fkey(
            id,
            first_name,
            last_name,
            profile_image_url
          )
        `
        )
        .eq("community_id", communityId)
        .order("joined_at", { ascending: true });

      if (error) {
        console.error("Error fetching members:", error);
        return;
      }

      const transformedMembers =
        data?.map((member) => ({
          ...member,
          user_name: member.user
            ? `${member.user.first_name} ${member.user.last_name}`
            : "Unknown",
          user_avatar: member.user?.profile_image_url || null,
        })) || [];

      setMembers(transformedMembers);
    } catch (error) {
      console.error("Error:", error);
    }
  }, [communityId]);

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    try {
      setSendingMessage(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast({
          title: "Error",
          description: "You must be logged in to send messages",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("messages").insert([
        {
          content: newMessage.trim(),
          sender_id: user.id,
          community_id: communityId,
        },
      ]);

      if (error) {
        console.error("Error sending message:", error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        return;
      }

      setNewMessage("");
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  // Delete community
  const handleDeleteCommunity = async () => {
    if (!community) return;

    try {
      const { error } = await supabase
        .from("communities")
        .delete()
        .eq("id", community.id);

      if (error) {
        console.error("Error deleting community:", error);
        toast({
          title: "Error",
          description: "Failed to delete community",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Community deleted successfully",
      });

      setDeleteDialogOpen(false);
      router.push("/admin/communities");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Format time
  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      const diffInMins = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );
      return `${diffInMins}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize params
  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setCommunityId(resolvedParams.id);
    };
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (communityId) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchCommunity(), fetchMessages(), fetchMembers()]);
        setLoading(false);
      };
      loadData();
    }
  }, [communityId, fetchCommunity, fetchMessages, fetchMembers]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="h-96 bg-muted rounded"></div>
          </div>
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
              Community Not Found
            </h1>
          </div>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Community not found
            </h3>
            <p className="text-muted-foreground mb-4">
              The community you&apos;re looking for doesn&apos;t exist or has
              been deleted.
            </p>
            <Button onClick={() => router.push("/admin/communities")}>
              Back to Communities
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-3">
            {community.image_url ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={community.image_url}
                  alt={community.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
            )}
            <div>
              <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
                {community.name}
              </h1>
              <p className={textStyles.body.regular}>
                {members.length} members • Created{" "}
                {formatTime(community.created_at)}
              </p>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() =>
                router.push(`/admin/communities/${community.id}/edit`)
              }
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Community
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Community
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Messages</span>
              </CardTitle>
              {community.description && (
                <p className="text-sm text-muted-foreground">
                  {community.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No messages yet
                    </h3>
                    <p className="text-muted-foreground">
                      Be the first to start the conversation!
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-start space-x-3"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.sender_avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {message.sender_name?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {message.sender_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.created_at)}
                          </span>
                          {message.is_pinned && (
                            <Pin className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <p className="text-sm text-foreground">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-border p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    disabled={sendingMessage}
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                  >
                    {sendingMessage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Community Info */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Members</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.user_avatar || undefined} />
                    <AvatarFallback className="text-xs">
                      {member.user_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {member.user_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
              {members.length > 5 && (
                <p className="text-xs text-muted-foreground">
                  +{members.length - 5} more members
                </p>
              )}
            </CardContent>
          </Card>

          {/* Community Stats */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Members:</span>
                <span className="text-foreground">{members.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Messages:</span>
                <span className="text-foreground">{messages.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created:</span>
                <span className="text-foreground">
                  {community.created_at
                    ? new Date(community.created_at).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* R/HOOD Themed Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border/50 backdrop-blur-sm shadow-2xl max-w-md">
          <AlertDialogHeader className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-brand-green" />
              </div>
              <AlertDialogTitle className="font-ts-block ts-lg uppercase text-brand-white tracking-wide">
                Delete Community
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="font-helvetica-regular helvetica-base text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-helvetica-bold text-brand-white">
                "{community?.name}"
              </span>
              ? This action cannot be undone and will permanently remove the community and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="space-x-3">
            <AlertDialogCancel 
              className="border-border/50 text-brand-white hover:bg-muted/50 hover:border-brand-green/50 font-helvetica-regular helvetica-base transition-all duration-300"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-helvetica-bold helvetica-base shadow-glow-primary transition-all duration-300"
              onClick={handleDeleteCommunity}
            >
              Delete Community
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
