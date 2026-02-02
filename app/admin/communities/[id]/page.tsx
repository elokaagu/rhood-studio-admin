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
  Lock,
  Plus,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  community_id?: string | null;
  author_id: string | null;
  sender_name?: string;
  sender_avatar?: string | null;
  is_pinned?: boolean;
  media_url?: string | null;
}

interface Member {
  id: string;
  user_id: string | null;
  role: string | null;
  joined_at: string | null;
  user_name?: string;
  user_avatar?: string | null;
}

interface PrivateChat {
  id: string;
  name: string;
  description: string | null;
  community_id: string;
  created_by: string;
  created_at: string;
  member_count?: number;
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const [communityId, setCommunityId] = useState<string | null>(null);
  const [privateChats, setPrivateChats] = useState<PrivateChat[]>([]);
  const [selectedPrivateChatId, setSelectedPrivateChatId] = useState<string | null>(null);
  const [createChatDialogOpen, setCreateChatDialogOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [newChatDescription, setNewChatDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string | null>(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);

  // Fetch community details
  const fetchCommunity = useCallback(async () => {
    if (!communityId) return;

    try {
      // Reset image state when fetching new community
      setImageError(false);
      setImageLoading(true);

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
          : "Admin",
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

  // Fetch current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Fetch private chats (only ones user is a member of)
  const fetchPrivateChats = useCallback(async () => {
    if (!communityId || !currentUserId) return;

    try {
      // First get private chat IDs where user is a member
      const { data: memberChats, error: memberError } = await (supabase.from as any)("private_chat_members")
        .select("private_chat_id")
        .eq("user_id", currentUserId);

      if (memberError) {
        console.error("Error fetching private chat memberships:", memberError);
        return;
      }

      if (!memberChats || memberChats.length === 0) {
        setPrivateChats([]);
        return;
      }

      const chatIds = memberChats.map((m: { private_chat_id: string }) => m.private_chat_id);

      // Then fetch the private chats for this community
      const { data, error } = await (supabase.from as any)("private_chats")
        .select("*")
        .eq("community_id", communityId)
        .in("id", chatIds)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching private chats:", error);
        return;
      }

      // Get member counts for each chat
      const chatsWithCounts = await Promise.all(
        (data || []).map(async (chat: { id: string }) => {
          const { count } = await (supabase.from as any)("private_chat_members")
            .select("*", { count: "exact", head: true })
            .eq("private_chat_id", chat.id);

          return {
            ...chat,
            member_count: count || 0,
          };
        })
      );

      setPrivateChats(chatsWithCounts as PrivateChat[]);
    } catch (error) {
      console.error("Error:", error);
    }
  }, [communityId, currentUserId]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!communityId) {
      console.log("No communityId, skipping fetchMessages");
      return;
    }

    console.log(`Fetching messages for ${selectedPrivateChatId ? 'private chat' : 'community'}: ${selectedPrivateChatId || communityId}`);

    try {
      let query = supabase
        .from("community_posts")
        .select(
          `
          *,
          author:user_profiles!community_posts_author_id_fkey(
            id,
            first_name,
            last_name,
            profile_image_url
          )
        `
        );

      if (selectedPrivateChatId) {
        // Fetch private chat messages
        query = query.eq("private_chat_id", selectedPrivateChatId);
      } else {
        // Fetch public community messages
        query = query.eq("community_id", communityId).is("private_chat_id", null);
      }

      const { data, error } = await query.order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        return;
      }

      console.log(
        `Found ${data?.length || 0} messages for community ${communityId}:`,
        data
      );

      const transformedMessages =
        data?.map((message) => {
          const author = (message as unknown as { author?: { first_name?: string; last_name?: string; profile_image_url?: string } }).author;

          return {
            id: message.id,
            content: message.content,
            created_at: message.created_at,
            community_id: message.community_id,
            author_id: message.author_id,
            is_pinned: (message as { is_pinned?: boolean }).is_pinned,
            media_url: (message as { media_url?: string | null }).media_url,
            sender_name: author
              ? `${author.first_name ?? ""} ${author.last_name ?? ""}`.trim() || "Unknown"
              : "Unknown",
            sender_avatar: author?.profile_image_url || null,
          } satisfies Message;
        }) || [];

      console.log("Transformed messages:", transformedMessages);
      setMessages(transformedMessages);
    } catch (error) {
      console.error("Error in fetchMessages:", error);
    }
  }, [communityId, selectedPrivateChatId]);

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

      // For admin interface, we'll use a default admin user or the first available user
      let senderId: string | null = null;

      try {
        // First try to get the authenticated user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (user && !userError) {
          senderId = user.id;
        }
      } catch (authError) {
        console.log("Auth not available, using fallback user");
      }

      // If no authenticated user, use the first available user as fallback
      if (!senderId) {
        const { data: users } = await supabase
          .from("user_profiles")
          .select("id")
          .limit(1);

        if (users && users.length > 0) {
          senderId = users[0].id;
        }
      }

      if (!senderId) {
        toast({
          title: "Error",
          description: "No user available to send message",
          variant: "destructive",
        });
        return;
      }

      console.log(
        "Sending message with author_id:",
        senderId,
        "to community:",
        communityId
      );

      const insertData: any = {
        content: newMessage.trim(),
        author_id: senderId,
      };

      if (selectedPrivateChatId) {
        insertData.private_chat_id = selectedPrivateChatId;
        insertData.community_id = null;
      } else {
        insertData.community_id = communityId;
        insertData.private_chat_id = null;
      }

      const { error } = await supabase.from("community_posts").insert([insertData]);

      if (error) {
        console.error("Error sending message:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        toast({
          title: "Error",
          description: `Failed to send message: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Message sent successfully");
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
    if (!community || isDeleting) return;

    try {
      setIsDeleting(true);
      console.log("Deleting community:", community.id);

      // First, delete related community members
      const { error: membersError } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", community.id);

      if (membersError) {
        console.error("Error deleting community members:", membersError);
        // Continue with community deletion even if members deletion fails
      }

      // Delete the community
      const { error } = await supabase
        .from("communities")
        .delete()
        .eq("id", community.id);

      if (error) {
        console.error("Error deleting community:", error);
        toast({
          title: "Error",
          description: `Failed to delete community: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Community deleted successfully from database");

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
    } finally {
      setIsDeleting(false);
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

  // Fetch available users (not already members)
  const fetchAvailableUsers = useCallback(async () => {
    if (!communityId) return;

    try {
      const { data: allUsers, error } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name, dj_name, brand_name, email, profile_image_url")
        .order("first_name", { ascending: true });

      if (error) {
        console.error("Error fetching users:", error);
        return;
      }

      // Filter out users who are already members
      const memberUserIds = members.map((m) => m.user_id);
      const available = (allUsers || []).filter(
        (user) => !memberUserIds.includes(user.id)
      );

      setAvailableUsers(available);
    } catch (error) {
      console.error("Error:", error);
    }
  }, [communityId, members]);

  // Add member to community
  const handleAddMember = async () => {
    if (!selectedUserToAdd || !communityId) {
      toast({
        title: "Error",
        description: "Please select a user to add",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAddingMember(true);

      const { error } = await supabase.from("community_members").insert([
        {
          community_id: communityId,
          user_id: selectedUserToAdd,
          role: "member",
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation - user already a member
          toast({
            title: "Already a Member",
            description: "This user is already a member of this community",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      // Update community member count
      const { count: newMemberCount } = await supabase
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .eq("community_id", communityId);

      if (newMemberCount !== null) {
        await supabase
          .from("communities")
          .update({ member_count: newMemberCount })
          .eq("id", communityId);
      }

      toast({
        title: "Success",
        description: "Member added successfully",
      });

      setAddMemberDialogOpen(false);
      setSelectedUserToAdd(null);
      setSearchTerm("");
      fetchMembers();
      fetchAvailableUsers();
      fetchCommunity(); // Refresh community to update member count
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add member",
        variant: "destructive",
      });
    } finally {
      setIsAddingMember(false);
    }
  };

  // Remove member from community
  const handleRemoveMember = async () => {
    if (!memberToRemove || !communityId) return;

    try {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("id", memberToRemove.id)
        .eq("community_id", communityId);

      if (error) throw error;

      // Update community member count
      const { count: newMemberCount } = await supabase
        .from("community_members")
        .select("*", { count: "exact", head: true })
        .eq("community_id", communityId);

      if (newMemberCount !== null) {
        await supabase
          .from("communities")
          .update({ member_count: newMemberCount })
          .eq("id", communityId);
      }

      toast({
        title: "Success",
        description: "Member removed successfully",
      });

      setRemoveMemberDialogOpen(false);
      setMemberToRemove(null);
      fetchMembers();
      fetchAvailableUsers();
      fetchCommunity(); // Refresh community to update member count
    } catch (error: any) {
      console.error("Error removing member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    }
  };

  // Create private chat
  const handleCreatePrivateChat = async () => {
    if (!newChatName.trim() || !communityId || !currentUserId) {
      toast({
        title: "Error",
        description: "Please provide a chat name",
        variant: "destructive",
      });
      return;
    }

    if (selectedMembers.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one member",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create private chat
      const { data: chat, error: chatError } = await (supabase.from as any)("private_chats")
        .insert({
          name: newChatName.trim(),
          description: newChatDescription.trim() || null,
          community_id: communityId,
          created_by: currentUserId,
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add creator as member
      const membersToAdd = [
        { private_chat_id: chat.id, user_id: currentUserId, added_by: currentUserId },
        ...selectedMembers.map((userId) => ({
          private_chat_id: chat.id,
          user_id: userId,
          added_by: currentUserId,
        })),
      ];

      const { error: membersError } = await (supabase.from as any)("private_chat_members")
        .insert(membersToAdd);

      if (membersError) throw membersError;

      toast({
        title: "Success",
        description: "Private chat created successfully",
      });

      setCreateChatDialogOpen(false);
      setNewChatName("");
      setNewChatDescription("");
      setSelectedMembers([]);
      fetchPrivateChats();
    } catch (error: any) {
      console.error("Error creating private chat:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create private chat",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (communityId && currentUserId) {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchCommunity(), fetchMessages(), fetchMembers(), fetchPrivateChats()]);
        setLoading(false);
      };
      loadData();
    }
  }, [communityId, currentUserId, fetchCommunity, fetchMessages, fetchMembers, fetchPrivateChats]);

  useEffect(() => {
    if (communityId) {
      fetchMessages();
    }
  }, [selectedPrivateChatId, communityId, fetchMessages]);

  useEffect(() => {
    if (!communityId) return;

    const channel = supabase
      .channel(`community-posts-${communityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "community_posts",
          filter: selectedPrivateChatId 
            ? `private_chat_id=eq.${selectedPrivateChatId}`
            : `community_id=eq.${communityId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe((status) => {
        console.log("Subscribed to community_posts changes:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId, selectedPrivateChatId, fetchMessages]);

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
    <div className="space-y-6 animate-blur-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-3">
            {!community.image_url || imageError ? (
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
            ) : (
              <div className="relative w-10 h-10 rounded-full overflow-hidden">
                <Image
                  src={community.image_url}
                  alt={community.name}
                  fill
                  className="object-cover transition-opacity duration-300"
                  sizes="40px"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  loading="eager"
                  priority={true}
                  unoptimized={true}
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                  onLoad={() => {
                    setImageLoading(false);
                  }}
                />
                {imageLoading && (
                  <div className="absolute inset-0 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                    <MessageSquare className="h-5 w-5 text-primary/50" />
                  </div>
                )}
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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>{selectedPrivateChatId ? "Private Chat" : "Messages"}</span>
                </CardTitle>
                {selectedPrivateChatId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPrivateChatId(null)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Back to Community
                  </Button>
                )}
              </div>
              {selectedPrivateChatId ? (
                <p className="text-sm text-muted-foreground">
                  {privateChats.find(c => c.id === selectedPrivateChatId)?.name}
                </p>
              ) : community.description ? (
                <p className="text-sm text-muted-foreground">
                  {community.description}
                </p>
              ) : null}
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
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Members</span>
                </CardTitle>
                <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => fetchAvailableUsers()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Member</DialogTitle>
                      <DialogDescription>
                        Search and select a user to add to this community
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="search-user">Search Users</Label>
                        <Input
                          id="search-user"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search by name or email..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Select User</Label>
                        <div className="max-h-64 overflow-y-auto space-y-2 border rounded-md p-2">
                          {availableUsers
                            .filter((user) => {
                              if (!searchTerm) return true;
                              const search = searchTerm.toLowerCase();
                              const name = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
                              const djName = (user.dj_name || "").toLowerCase();
                              const brandName = (user.brand_name || "").toLowerCase();
                              const email = (user.email || "").toLowerCase();
                              return name.includes(search) || djName.includes(search) || brandName.includes(search) || email.includes(search);
                            })
                            .map((user) => {
                              const displayName = user.dj_name || user.brand_name || `${user.first_name} ${user.last_name}`.trim() || user.email;
                              return (
                                <div
                                  key={user.id}
                                  className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer hover:bg-secondary ${
                                    selectedUserToAdd === user.id ? "bg-brand-green/20 border border-brand-green" : ""
                                  }`}
                                  onClick={() => setSelectedUserToAdd(user.id)}
                                >
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={user.profile_image_url || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {displayName[0]?.toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {displayName}
                                    </p>
                                    {user.email && (
                                      <p className="text-xs text-muted-foreground truncate">
                                        {user.email}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          {availableUsers.filter((user) => {
                            if (!searchTerm) return true;
                            const search = searchTerm.toLowerCase();
                            const name = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase();
                            const djName = (user.dj_name || "").toLowerCase();
                            const brandName = (user.brand_name || "").toLowerCase();
                            const email = (user.email || "").toLowerCase();
                            return name.includes(search) || djName.includes(search) || brandName.includes(search) || email.includes(search);
                          }).length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-4">
                              {searchTerm ? "No users found" : "All users are already members"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setAddMemberDialogOpen(false);
                          setSelectedUserToAdd(null);
                          setSearchTerm("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddMember}
                        disabled={!selectedUserToAdd || isAddingMember}
                      >
                        {isAddingMember ? "Adding..." : "Add Member"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between group">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setMemberToRemove(member);
                          setRemoveMemberDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No members yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Private Chats */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span>Private Chats</span>
                </CardTitle>
                <Dialog open={createChatDialogOpen} onOpenChange={setCreateChatDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create Private Chat</DialogTitle>
                      <DialogDescription>
                        Create a private chat visible only to selected members
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="chat-name">Chat Name</Label>
                        <Input
                          id="chat-name"
                          value={newChatName}
                          onChange={(e) => setNewChatName(e.target.value)}
                          placeholder="Enter chat name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chat-description">Description (Optional)</Label>
                        <Textarea
                          id="chat-description"
                          value={newChatDescription}
                          onChange={(e) => setNewChatDescription(e.target.value)}
                          placeholder="Enter description"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Select Members</Label>
                        <div className="max-h-48 overflow-y-auto space-y-2 border rounded-md p-2">
                          {members
                            .filter((m) => m.user_id !== currentUserId)
                            .map((member) => (
                              <div key={member.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`member-${member.id}`}
                                  checked={selectedMembers.includes(member.user_id || "")}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedMembers([...selectedMembers, member.user_id || ""]);
                                    } else {
                                      setSelectedMembers(selectedMembers.filter((id) => id !== member.user_id));
                                    }
                                  }}
                                />
                                <Label
                                  htmlFor={`member-${member.id}`}
                                  className="flex items-center space-x-2 flex-1 cursor-pointer"
                                >
                                  <Avatar className="w-6 h-6">
                                    <AvatarImage src={member.user_avatar || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {member.user_name?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{member.user_name}</span>
                                </Label>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCreateChatDialogOpen(false);
                          setNewChatName("");
                          setNewChatDescription("");
                          setSelectedMembers([]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreatePrivateChat}>
                        Create Chat
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {!selectedPrivateChatId && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => setSelectedPrivateChatId(null)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Community Chat
                </Button>
              )}
              {privateChats.map((chat) => (
                <Button
                  key={chat.id}
                  variant={selectedPrivateChatId === chat.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedPrivateChatId(chat.id)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  <span className="truncate">{chat.name}</span>
                </Button>
              ))}
              {privateChats.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No private chats yet
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
                <span className="text-muted-foreground">Private Chats:</span>
                <span className="text-foreground">{privateChats.length}</span>
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

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={removeMemberDialogOpen} onOpenChange={setRemoveMemberDialogOpen}>
        <AlertDialogContent className="bg-card border-border/50 backdrop-blur-sm shadow-2xl max-w-md">
          <AlertDialogHeader className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-brand-green" />
              </div>
              <AlertDialogTitle className="font-ts-block ts-lg uppercase text-brand-white tracking-wide">
                Remove Member
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="font-helvetica-regular helvetica-base text-muted-foreground">
              Are you sure you want to remove{" "}
              <span className="font-helvetica-bold text-brand-white">
                {memberToRemove?.user_name}
              </span>
              {" "}from this community? They will no longer have access to community messages and private chats.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="space-x-3">
            <AlertDialogCancel
              className="border-border/50 text-brand-white hover:bg-muted/50 hover:border-brand-green/50 font-helvetica-regular helvetica-base transition-all duration-300"
              onClick={() => {
                setRemoveMemberDialogOpen(false);
                setMemberToRemove(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-helvetica-bold helvetica-base shadow-glow-primary transition-all duration-300"
              onClick={handleRemoveMember}
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                &quot;{community?.name}&quot;
              </span>
              ? This action cannot be undone and will permanently remove the
              community and all its messages.
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
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive-foreground mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete Community"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
