"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createPrivateChatWithMembers } from "@/lib/communities/community-detail-api";
import type {
  CommunityMemberView,
  PrivateChatSummary,
} from "@/lib/communities/community-detail-types";
import { Lock, Plus, MessageSquare } from "lucide-react";

type Props = {
  communityId: string;
  currentUserId: string | null;
  members: CommunityMemberView[];
  privateChats: PrivateChatSummary[];
  selectedPrivateChatId: string | null;
  onSelectChat: (id: string | null) => void;
  onPrivateChatCreated: () => void;
};

export function CommunityPrivateChatsSidebarCard({
  communityId,
  currentUserId,
  members,
  privateChats,
  selectedPrivateChatId,
  onSelectChat,
  onPrivateChatCreated,
}: Props) {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [newChatDescription, setNewChatDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleCreate = async () => {
    if (!newChatName.trim() || !currentUserId) {
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

    const result = await createPrivateChatWithMembers({
      communityId,
      currentUserId,
      name: newChatName.trim(),
      description: newChatDescription.trim() || null,
      memberUserIds: selectedMembers,
    });

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
      description: "Private chat created successfully",
    });
    setCreateOpen(false);
    setNewChatName("");
    setNewChatDescription("");
    setSelectedMembers([]);
    onPrivateChatCreated();
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span>Private Chats</span>
          </CardTitle>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
                        <div
                          key={member.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`member-${member.id}`}
                            checked={selectedMembers.includes(
                              member.user_id || ""
                            )}
                            onCheckedChange={(checked) => {
                              const uid = member.user_id || "";
                              if (checked) {
                                setSelectedMembers((prev) =>
                                  prev.includes(uid) ? prev : [...prev, uid]
                                );
                              } else {
                                setSelectedMembers((prev) =>
                                  prev.filter((id) => id !== uid)
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={`member-${member.id}`}
                            className="flex items-center space-x-2 flex-1 cursor-pointer"
                          >
                            <Avatar className="w-6 h-6">
                              <AvatarImage
                                src={member.user_avatar || undefined}
                              />
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
                    setCreateOpen(false);
                    setNewChatName("");
                    setNewChatDescription("");
                    setSelectedMembers([]);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Create Chat</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {!selectedPrivateChatId ? (
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => onSelectChat(null)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Community Chat
          </Button>
        ) : null}
        {privateChats.map((chat) => (
          <Button
            key={chat.id}
            variant={selectedPrivateChatId === chat.id ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => onSelectChat(chat.id)}
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
  );
}
