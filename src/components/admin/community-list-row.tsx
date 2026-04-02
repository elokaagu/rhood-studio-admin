"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { textStyles } from "@/lib/typography";
import type { CommunityListItem } from "@/lib/communities/fetch-communities-list";
import {
  MessageSquare,
  Users,
  Settings,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";

const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

export type CommunityListRowProps = {
  community: CommunityListItem;
  formatDate: (dateString: string | null) => string;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
};

export function CommunityListRow({
  community,
  formatDate,
  onView,
  onEdit,
  onDelete,
}: CommunityListRowProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {community.image_url && !imageError ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden">
                  <Image
                    src={community.image_url}
                    alt={community.name}
                    fill
                    className="object-cover transition-opacity duration-300"
                    sizes="48px"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    loading="eager"
                    priority={true}
                    unoptimized={true}
                    onError={() => setImageError(true)}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-brand-green/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-brand-green" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-1">
                <CardTitle
                  className={`${textStyles.subheading.regular} truncate`}
                >
                  {community.name}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {community.member_count} members
                  </span>
                </div>
              </div>

              {community.description && (
                <p
                  className={`${textStyles.body.small} text-muted-foreground mb-2 line-clamp-1`}
                >
                  {community.description}
                </p>
              )}

              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Avatar className="w-4 h-4">
                    <AvatarImage
                      src={community.creator_avatar || undefined}
                    />
                    <AvatarFallback className="text-xs">
                      {community.creator_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>Created by {community.creator_name}</span>
                </div>
                <span>{formatDate(community.created_at)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(community.id)}
                className="text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">View Chat</span>
                <span className="sm:hidden">View</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(community.id)}
                className="text-xs sm:text-sm"
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(community.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onView(community.id)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Messages
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete(community.id, community.name)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
