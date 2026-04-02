"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageSquare } from "lucide-react";
import {
  fetchCommunityDetail,
  fetchCommunityMessages,
  fetchCommunityMembers,
  fetchPrivateChatsForUser,
  removeCommunityMember,
  sendCommunityPost,
  deleteCommunityCascade,
} from "@/lib/communities/community-detail-api";
import { formatCommunityRelativeTime } from "@/lib/communities/format-community-relative-time";
import type { CommunityDetail } from "@/lib/communities/community-detail-types";
import type { CommunityChatMessage } from "@/lib/communities/community-detail-types";
import type { CommunityMemberView } from "@/lib/communities/community-detail-types";
import type { PrivateChatSummary } from "@/lib/communities/community-detail-types";
import { useCommunityPostsRealtime } from "@/hooks/use-community-posts-realtime";
import { CommunityDetailHeader } from "@/components/admin/communities/CommunityDetailHeader";
import { CommunityChatPanel } from "@/components/admin/communities/CommunityChatPanel";
import { CommunityMembersSidebarCard } from "@/components/admin/communities/CommunityMembersSidebarCard";
import { CommunityPrivateChatsSidebarCard } from "@/components/admin/communities/CommunityPrivateChatsSidebarCard";
import { CommunityStatsSidebarCard } from "@/components/admin/communities/CommunityStatsSidebarCard";
import { CommunityMemberRemoveDialog } from "@/components/admin/communities/CommunityMemberRemoveDialog";
import { CommunityDeleteDialog } from "@/components/admin/communities/CommunityDeleteDialog";

export default function CommunityDetailsPage() {
  const params = useParams();
  const communityId = useMemo(() => {
    const raw = params?.id;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw) && raw[0]) return raw[0];
    return null;
  }, [params]);

  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [messages, setMessages] = useState<CommunityChatMessage[]>([]);
  const [members, setMembers] = useState<CommunityMemberView[]>([]);
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

  const [privateChats, setPrivateChats] = useState<PrivateChatSummary[]>([]);
  const [selectedPrivateChatId, setSelectedPrivateChatId] = useState<
    string | null
  >(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [removeMemberDialogOpen, setRemoveMemberDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] =
    useState<CommunityMemberView | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });
  }, []);

  const fetchCommunity = useCallback(async () => {
    if (!communityId) return;

    setImageError(false);
    setImageLoading(true);

    const result = await fetchCommunityDetail(communityId);
    if (!result.ok) {
      toast({
        title: "Error",
        description: "Failed to fetch community details",
        variant: "destructive",
      });
      setCommunity(null);
      return;
    }

    setCommunity(result.community);
  }, [communityId]);

  const fetchMessages = useCallback(async () => {
    if (!communityId) return;
    const list = await fetchCommunityMessages(
      communityId,
      selectedPrivateChatId
    );
    setMessages(list);
  }, [communityId, selectedPrivateChatId]);

  const fetchMembers = useCallback(async () => {
    if (!communityId) return;
    setMembers(await fetchCommunityMembers(communityId));
  }, [communityId]);

  const fetchPrivateChats = useCallback(async () => {
    if (!communityId || !currentUserId) return;
    setPrivateChats(
      await fetchPrivateChatsForUser(communityId, currentUserId)
    );
  }, [communityId, currentUserId]);

  const refreshAfterMemberChange = useCallback(async () => {
    await fetchMembers();
    await fetchCommunity();
  }, [fetchMembers, fetchCommunity]);

  useEffect(() => {
    if (!communityId) {
      setLoading(false);
      setCommunity(null);
      return;
    }
    if (!currentUserId) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([
        fetchCommunity(),
        fetchMessages(),
        fetchMembers(),
        fetchPrivateChats(),
      ]);
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when route or user id is ready; fetch fns track their own deps
  }, [communityId, currentUserId]);

  useEffect(() => {
    if (communityId) {
      void fetchMessages();
    }
  }, [selectedPrivateChatId, communityId, fetchMessages]);

  useCommunityPostsRealtime(communityId, selectedPrivateChatId, () => {
    void fetchMessages();
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !communityId) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Sign in required",
        description: "You must be signed in to send messages.",
        variant: "destructive",
      });
      return;
    }

    setSendingMessage(true);
    try {
      const result = await sendCommunityPost({
        communityId,
        selectedPrivateChatId,
        content: newMessage.trim(),
        authorId: user.id,
      });

      if (!result.ok) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      setNewMessage("");
      await fetchMessages();
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!community || isDeleting) return;

    setIsDeleting(true);
    try {
      const result = await deleteCommunityCascade(community.id);
      if (!result.ok) {
        toast({
          title: "Error",
          description: result.message,
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
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove || !communityId) return;

    const result = await removeCommunityMember(
      communityId,
      memberToRemove.id
    );

    if (!result.ok) {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Success", description: "Member removed successfully" });
    setRemoveMemberDialogOpen(false);
    setMemberToRemove(null);
    await refreshAfterMemberChange();
  };

  const formatTime = useCallback((d: string | null) => formatCommunityRelativeTime(d), []);

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

  if (!community || !communityId) {
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
      <CommunityDetailHeader
        community={community}
        memberCount={members.length}
        imageError={imageError}
        imageLoading={imageLoading}
        onImageError={() => setImageError(true)}
        onImageLoad={() => setImageLoading(false)}
        formatTime={formatTime}
        onDeleteClick={() => setDeleteDialogOpen(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <CommunityChatPanel
            communityDescription={community.description}
            messages={messages}
            messagesEndRef={messagesEndRef}
            newMessage={newMessage}
            onNewMessageChange={setNewMessage}
            sendingMessage={sendingMessage}
            onSubmit={handleSendMessage}
            selectedPrivateChatId={selectedPrivateChatId}
            privateChats={privateChats}
            onBackToCommunity={() => setSelectedPrivateChatId(null)}
            formatTime={formatTime}
          />
        </div>

        <div className="space-y-4">
          <CommunityMembersSidebarCard
            communityId={communityId}
            members={members}
            onMemberAdded={refreshAfterMemberChange}
            onRemoveMemberRequest={(m) => {
              setMemberToRemove(m);
              setRemoveMemberDialogOpen(true);
            }}
          />

          <CommunityPrivateChatsSidebarCard
            communityId={communityId}
            currentUserId={currentUserId}
            members={members}
            privateChats={privateChats}
            selectedPrivateChatId={selectedPrivateChatId}
            onSelectChat={setSelectedPrivateChatId}
            onPrivateChatCreated={fetchPrivateChats}
          />

          <CommunityStatsSidebarCard
            memberCount={members.length}
            messageCount={messages.length}
            privateChatCount={privateChats.length}
            createdAt={community.created_at}
          />
        </div>
      </div>

      <CommunityMemberRemoveDialog
        open={removeMemberDialogOpen}
        onOpenChange={(open: boolean) => {
          setRemoveMemberDialogOpen(open);
          if (!open) setMemberToRemove(null);
        }}
        member={memberToRemove}
        onConfirm={handleRemoveMember}
      />

      <CommunityDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        communityName={community?.name ?? null}
        isDeleting={isDeleting}
        onConfirm={handleDeleteCommunity}
      />
    </div>
  );
}
