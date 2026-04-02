"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { textStyles } from "@/lib/typography";
import type { BrandMember } from "@/lib/brands/types";
import {
  MapPin,
  Calendar,
  Mail,
  Trash2,
  MoreVertical,
  Eye,
  Briefcase,
  FileText,
  CheckCircle,
  Clock,
} from "lucide-react";

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-transparent text-brand-green border-brand-green text-xs">
          Active
        </Badge>
      );
    case "inactive":
      return (
        <Badge className="bg-transparent text-gray-400 border-gray-400 text-xs">
          Inactive
        </Badge>
      );
    default:
      return (
        <Badge className="bg-transparent text-gray-400 border-gray-400 text-xs">
          {status}
        </Badge>
      );
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

type Props = {
  members: BrandMember[];
  isLoading: boolean;
  onMessage: (member: BrandMember) => void;
  onDeleteRequest: (memberId: string, memberName: string) => void;
};

export function BrandMemberList({
  members,
  isLoading,
  onMessage,
  onDeleteRequest,
}: Props) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className={textStyles.body.regular}>Loading brands...</p>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <p className={textStyles.body.regular}>No brands found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member) => (
        <Card key={member.id} className="bg-card border-border">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 bg-brand-green flex-shrink-0">
                  <AvatarImage
                    src={member.profileImageUrl ?? undefined}
                    alt={member.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-brand-black font-bold text-xs sm:text-sm">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`${textStyles.subheading.large} text-base sm:text-lg truncate`}
                    >
                      {member.brandName || member.name}
                    </h3>
                  </div>

                  <p
                    className={`${textStyles.body.regular} text-muted-foreground text-xs sm:text-sm truncate`}
                  >
                    {member.email}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground mt-2">
                    {member.location && (
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="truncate">{member.location}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="truncate">Joined {member.joinedDate}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1 text-xs sm:text-sm">
                      <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 text-brand-green" />
                      <span className="text-foreground font-semibold">
                        {member.opportunitiesCount}
                      </span>
                      <span className="text-muted-foreground">Opportunities</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs sm:text-sm">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-brand-green" />
                      <span className="text-foreground font-semibold">
                        {member.totalApplications}
                      </span>
                      <span className="text-muted-foreground">Applications</span>
                    </div>
                    {member.pendingApplications > 0 && (
                      <div className="flex items-center gap-1 text-xs sm:text-sm">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-brand-green" />
                        <span className="text-foreground font-semibold">
                          {member.pendingApplications}
                        </span>
                        <span className="text-muted-foreground">Pending</span>
                      </div>
                    )}
                    {member.approvedApplications > 0 && (
                      <div className="flex items-center gap-1 text-xs sm:text-sm">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-brand-green" />
                        <span className="text-foreground font-semibold">
                          {member.approvedApplications}
                        </span>
                        <span className="text-muted-foreground">Approved</span>
                      </div>
                    )}
                    {member.recentOpportunity && (
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                        <span className="truncate max-w-[150px] sm:max-w-none">
                          Latest: {member.recentOpportunity}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:space-x-2">
                <div className="w-full sm:w-auto">{getStatusBadge(member.status)}</div>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-foreground text-xs sm:text-sm flex-1 sm:flex-initial"
                  onClick={() => router.push(`/admin/members/${member.id}`)}
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">View Details</span>
                  <span className="sm:hidden">View</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm flex-1 sm:flex-initial"
                  onClick={() => onMessage(member)}
                >
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Message</span>
                  <span className="sm:hidden">Msg</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    <DropdownMenuItem
                      onClick={() => onDeleteRequest(member.id, member.name)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
