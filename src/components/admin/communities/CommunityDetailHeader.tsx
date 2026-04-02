"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { textStyles } from "@/lib/typography";
import type { CommunityDetail } from "@/lib/communities/community-detail-types";
import { ArrowLeft, MessageSquare, MoreVertical, Edit, Trash2 } from "lucide-react";

type Props = {
  community: CommunityDetail;
  memberCount: number;
  imageError: boolean;
  imageLoading: boolean;
  onImageError: () => void;
  onImageLoad: () => void;
  formatTime: (date: string | null) => string;
  onDeleteClick: () => void;
};

export function CommunityDetailHeader({
  community,
  memberCount,
  imageError,
  imageLoading,
  onImageError,
  onImageLoad,
  formatTime,
  onDeleteClick,
}: Props) {
  const router = useRouter();

  return (
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
                onError={onImageError}
                onLoad={onImageLoad}
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
              {memberCount} members • Created {formatTime(community.created_at)}
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
            onClick={onDeleteClick}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Community
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
