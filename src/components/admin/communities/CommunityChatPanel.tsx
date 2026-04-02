"use client";

import React, { RefObject } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CommunityChatMessage } from "@/lib/communities/community-detail-types";
import type { PrivateChatSummary } from "@/lib/communities/community-detail-types";
import { MessageSquare, Pin, X, Send } from "lucide-react";

type Props = {
  communityDescription: string | null;
  messages: CommunityChatMessage[];
  messagesEndRef: RefObject<HTMLDivElement>;
  newMessage: string;
  onNewMessageChange: (v: string) => void;
  sendingMessage: boolean;
  onSubmit: (e: React.FormEvent) => void;
  selectedPrivateChatId: string | null;
  privateChats: PrivateChatSummary[];
  onBackToCommunity: () => void;
  formatTime: (date: string | null) => string;
};

export function CommunityChatPanel({
  communityDescription,
  messages,
  messagesEndRef,
  newMessage,
  onNewMessageChange,
  sendingMessage,
  onSubmit,
  selectedPrivateChatId,
  privateChats,
  onBackToCommunity,
  formatTime,
}: Props) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>{selectedPrivateChatId ? "Private Chat" : "Messages"}</span>
          </CardTitle>
          {selectedPrivateChatId && (
            <Button variant="ghost" size="sm" onClick={onBackToCommunity}>
              <X className="h-4 w-4 mr-2" />
              Back to Community
            </Button>
          )}
        </div>
        {selectedPrivateChatId ? (
          <p className="text-sm text-muted-foreground">
            {privateChats.find((c) => c.id === selectedPrivateChatId)?.name}
          </p>
        ) : communityDescription ? (
          <p className="text-sm text-muted-foreground">{communityDescription}</p>
        ) : null}
      </CardHeader>
      <CardContent className="p-0">
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
              <div key={message.id} className="flex items-start space-x-3">
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
                  <p className="text-sm text-foreground">{message.content}</p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border p-4">
          <form onSubmit={onSubmit} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => onNewMessageChange(e.target.value)}
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
  );
}
