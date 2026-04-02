"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CommunityMemberView } from "@/lib/communities/community-detail-types";
import { CommunityAddMemberTrigger } from "./CommunityAddMemberDialog";
import { Users, MoreVertical, Trash2 } from "lucide-react";

type Props = {
  communityId: string;
  members: CommunityMemberView[];
  onMemberAdded: () => void;
  onRemoveMemberRequest: (member: CommunityMemberView) => void;
};

export function CommunityMembersSidebarCard({
  communityId,
  members,
  onMemberAdded,
  onRemoveMemberRequest,
}: Props) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Members</span>
          </CardTitle>
          <CommunityAddMemberTrigger
            communityId={communityId}
            onMemberAdded={onMemberAdded}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between group"
          >
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
                <p className="text-xs text-muted-foreground">{member.role}</p>
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
                  onClick={() => onRemoveMemberRequest(member)}
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
  );
}
