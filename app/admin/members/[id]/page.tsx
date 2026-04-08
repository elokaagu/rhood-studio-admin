"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/date-utils";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  Music,
  Star,
  Edit,
  Trash2,
  MoreVertical,
  Key,
  CheckCircle,
  Coins,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteAdminMemberAction } from "@/actions/admin-members";
import {
  creatorLabelFromInviteCode,
  fetchAdminMemberProfile,
  socialUrlForPlatform,
  type AdminMemberInviteCodeRow,
  type AdminMemberProfileView,
} from "@/lib/admin/members/member-profile";

export default function MemberDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  const { toast } = useToast();
  const [member, setMember] = useState<AdminMemberProfileView | null>(null);
  const [inviteCodes, setInviteCodes] = useState<AdminMemberInviteCodeRow[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!memberId) return;
    setIsLoading(true);
    setLoadError(null);
    const result = await fetchAdminMemberProfile(memberId);
    if (!result.ok) {
      setMember(null);
      setInviteCodes([]);
      setLoadError(result.message);
      setIsLoading(false);
      return;
    }
    setMember(result.member);
    setInviteCodes(result.inviteCodes);
    setIsLoading(false);
  }, [memberId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleDelete = () => {
    if (member) {
      setMemberToDelete({ id: memberId, name: member.name });
      setDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteAdminMemberAction(memberToDelete.id);
      if (!result.ok) {
        toast({
          title: "Delete Failed",
          description: result.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Member Deleted",
        description: `"${memberToDelete.name}" has been deleted successfully.`,
      });
      router.push("/admin/members");
    } catch (error) {
      console.error("Error deleting member:", error);
      toast({
        title: "Delete Failed",
        description:
          error instanceof Error ? error.message : "Unknown error deleting member.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setMemberToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setMemberToDelete(null);
  };

  const handleEmailMember = (memberName: string, memberEmail: string) => {
    const subject = encodeURIComponent(`R/HOOD — ${memberName}`);
    window.location.href = `mailto:${memberEmail}?subject=${subject}`;
  };

  const getStatusBadge = (status: "active" | "inactive") => {
    return status === "active" ? (
      <Badge
        variant="outline"
        className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase"
      >
        Active
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="border-gray-400 text-gray-400 bg-transparent text-xs"
      >
        Inactive
      </Badge>
    );
  };

  const getGenreBadge = (genre: string) => {
    return (
      <Badge
        variant="outline"
        className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase"
      >
        {genre}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !member) {
    return (
      <div className="space-y-6">
        <div className="text-center max-w-md mx-auto">
          <h1 className={textStyles.headline.section}>MEMBER NOT AVAILABLE</h1>
          <p className={`${textStyles.body.regular} mt-2`}>
            {loadError ||
              "The member you're looking for could not be loaded."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Button variant="outline" onClick={() => loadProfile()}>
              Retry
            </Button>
            <Button onClick={() => router.push("/admin/members")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Members
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isBrand = member.role === "brand";
  const displayName = member.brandName || member.name;

  const socialEntries = [
    { platform: "instagram" as const, label: "Instagram", handle: member.socialLinks.instagram },
    { platform: "soundcloud" as const, label: "SoundCloud", handle: member.socialLinks.soundcloud },
  ].filter((e) => e.handle?.trim());

  return (
    <div className="space-y-6 animate-blur-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
            {displayName}
          </h1>
          <p className={textStyles.body.regular}>
            {isBrand ? "Brand profile and details" : "Member profile and details"}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16 bg-brand-green">
                    <AvatarImage
                      src={member.profileImageUrl}
                      alt={member.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-brand-black font-bold text-lg">
                      {member.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle
                      className={`${textStyles.subheading.large} flex items-center`}
                    >
                      {member.name}
                      <Star className="h-4 w-4 ml-2 text-yellow-400" />
                      <span className="text-sm text-muted-foreground ml-1">
                        {member.rating || 0}
                      </span>
                    </CardTitle>
                    <p className={textStyles.body.regular}>{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(member.activityStatus)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {member.location}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  Joined {member.joinDate}
                </div>
                {!isBrand && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Music className="h-4 w-4 mr-2" />
                    {member.gigs} gigs
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className={textStyles.subheading.small}>Bio</h3>
                <p className={textStyles.body.regular}>{member.bio}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className={textStyles.subheading.small}>Email</h4>
                  <p className={textStyles.body.regular}>{member.email}</p>
                </div>
                <div>
                  <h4 className={textStyles.subheading.small}>Phone</h4>
                  <p className={`${textStyles.body.regular} text-muted-foreground`}>
                    Not on file (not stored on this profile)
                  </p>
                </div>
              </div>

              <div>
                <h4 className={textStyles.subheading.small}>Social Links</h4>
                {socialEntries.length === 0 ? (
                  <p className={`${textStyles.body.regular} text-muted-foreground`}>
                    No social links on file.
                  </p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {socialEntries.map(({ platform, label, handle }) => {
                      const url = socialUrlForPlatform(platform, handle);
                      return (
                        <div key={platform} className="flex flex-col gap-1">
                          <span className="capitalize text-sm text-muted-foreground">
                            {label}:
                          </span>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${textStyles.body.regular} text-brand-green hover:text-brand-green/80 underline hover:no-underline transition-colors break-words`}
                          >
                            {handle}
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Credit Transactions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={`${textStyles.subheading.small} flex items-center gap-2`}>
                <Coins className="h-4 w-4" />
                Credit Transactions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className={`${textStyles.body.small} text-muted-foreground`}>
                Transaction history is not loaded on this page. Open the full list to
                review credits for this member.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/admin/credits/transactions?user=${member.id}`)
                }
                className="w-full"
              >
                View All Transactions
              </Button>
            </CardContent>
          </Card>

          {/* Invite Codes */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={`${textStyles.subheading.small} flex items-center gap-2`}>
                <Key className="h-4 w-4" />
                Invite Codes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {inviteCodes.length === 0 ? (
                <p className={`${textStyles.body.regular} text-muted-foreground`}>
                  This member hasn&apos;t used any invite codes.
                </p>
              ) : (
                <div className="space-y-3">
                  {inviteCodes.map((code: AdminMemberInviteCodeRow) => (
                    <div
                      key={code.id}
                      className="p-4 bg-secondary rounded-md border border-border"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <code
                              className={`${textStyles.body.regular} font-mono text-brand-green font-semibold`}
                            >
                              {code.code}
                            </code>
                            <Badge
                              variant="outline"
                              className="border-green-500 text-green-500 bg-transparent"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Used
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>
                              <span className="font-semibold">Brand:</span>{" "}
                              {code.brand_name}
                            </p>
                            {code.used_at && (
                              <p>
                                <span className="font-semibold">Used on:</span>{" "}
                                {formatDate(code.used_at)}
                              </p>
                            )}
                            {code.created_by_profile && (
                              <p>
                                <span className="font-semibold">Created by:</span>{" "}
                                {creatorLabelFromInviteCode(code.created_by_profile)}
                              </p>
                            )}
                            {code.created_at && (
                              <p>
                                <span className="font-semibold">Created:</span>{" "}
                                {formatDate(code.created_at)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleEmailMember(member.name, member.email)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Email member
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/admin/members/${member.id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <MoreVertical className="h-4 w-4 mr-2" />
                    More Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-card border-border"
                >
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isBrand && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Music className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className={textStyles.body.regular}>Total Gigs</span>
                  </div>
                  <span className={textStyles.subheading.small}>{member.gigs}</span>
                </div>
              )}

              {!isBrand && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className={textStyles.body.regular}>Rating</span>
                  </div>
                  <span className={textStyles.subheading.small}>
                    {member.rating || 0.0}
                  </span>
                </div>
              )}

              {!isBrand && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Coins className="h-4 w-4 mr-2 text-brand-green" />
                    <span className={textStyles.body.regular}>Credits</span>
                  </div>
                  <span className={`${textStyles.subheading.small} text-brand-green`}>
                    {member.credits || 0}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle
              className={`${textStyles.subheading.large} text-brand-white`}
            >
              Delete Member
            </DialogTitle>
            <DialogDescription className={textStyles.body.regular}>
              Are you sure you want to delete &quot;{memberToDelete?.name}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={isDeleting}
              className="text-foreground border-border hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
