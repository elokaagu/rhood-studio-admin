"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

type Props = {
  memberCount: number;
  messageCount: number;
  privateChatCount: number;
  createdAt: string | null;
};

export function CommunityStatsSidebarCard({
  memberCount,
  messageCount,
  privateChatCount,
  createdAt,
}: Props) {
  return (
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
          <span className="text-foreground">{memberCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Messages:</span>
          <span className="text-foreground">{messageCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Private Chats:</span>
          <span className="text-foreground">{privateChatCount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Created:</span>
          <span className="text-foreground">
            {createdAt
              ? new Date(createdAt).toLocaleDateString()
              : "Unknown"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
