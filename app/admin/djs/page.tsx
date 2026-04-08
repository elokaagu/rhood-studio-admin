"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { textStyles } from "@/lib/typography";
import {
  Search,
  MapPin,
  Calendar,
  Mail,
  Star,
  UserPlus,
  X,
  Trash2,
  MoreVertical,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { deleteDj, fetchDjs } from "@/lib/admin/djs/service";
import type { DjMember, DjSortBy } from "@/lib/admin/djs/types";

export default function DJsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState<DjSortBy>("date_joined_newest");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [members, setMembers] = useState<DjMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<DjMember | null>(null);
  const [messageContent, setMessageContent] = useState("");

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchDjs(sortBy);
    if (!result.ok) {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
      setMembers([]);
      setIsLoading(false);
      return;
    }
    setMembers(result.data);
    setIsLoading(false);
  }, [sortBy, toast]);

  // Load members on component mount and when sorting changes
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const getStatusBadge = (status: string) => {
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
  };

  const getInitials = (name: string) => {
    if (!name.trim()) return "DJ";
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  // Filter members based on search term and active filter
  const filteredMembers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return members.filter((member) => {
      const matchesSearch =
        !q ||
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        (member.location || "").toLowerCase().includes(q) ||
        (member.djName || "").toLowerCase().includes(q) ||
        member.genres.some((genre) => genre.toLowerCase().includes(q));

      const matchesFilter = activeFilter === "all" || member.status === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [members, searchTerm, activeFilter]);

  const handleInviteMember = () => {
    setIsInviteModalOpen(true);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // In a real app, this would send the invite to the backend
      toast({
        title: "Invite Sent",
        description: `Invite sent to ${inviteFormData.name} (${inviteFormData.email})!`,
      });

      // Reset form and close modal
      setInviteFormData({ name: "", email: "", message: "" });
      setIsInviteModalOpen(false);
    } catch (error) {
      console.error("Error sending invite:", error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInviteCancel = () => {
    setInviteFormData({ name: "", email: "", message: "" });
    setIsInviteModalOpen(false);
  };

  const handleMessageMember = (member: DjMember) => {
    setSelectedMember(member);
    setMessageContent("");
    setMessageModalOpen(true);
  };

  const handleSendMessage = () => {
    if (!messageContent.trim() || !selectedMember) return;

    // Open mailto link with the message
    const subject = encodeURIComponent(`Message from R/HOOD Admin`);
    const body = encodeURIComponent(messageContent);
    window.location.assign(`mailto:${selectedMember.email}?subject=${subject}&body=${body}`);

    toast({
      title: "Message Sent",
      description: `Opening email client to send message to ${selectedMember.name}`,
    });

    setMessageModalOpen(false);
    setMessageContent("");
    setSelectedMember(null);
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    setMemberToDelete({ id: memberId, name: memberName });
    setDeleteModalOpen(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      setIsDeleting(true);
      const result = await deleteDj(memberToDelete.id);
      if (!result.ok) {
        throw new Error(result.message);
      }

      // Remove from local state immediately
      setMembers((prevMembers: DjMember[]) =>
        prevMembers.filter((member: DjMember) => member.id !== memberToDelete.id)
      );

      toast({
        title: "DJ Deleted",
        description: `"${memberToDelete.name}" has been deleted successfully.`,
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: `Failed to delete DJ: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setMemberToDelete(null);
    }
  };

  const cancelDeleteMember = () => {
    setDeleteModalOpen(false);
    setMemberToDelete(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-blur-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white text-lg sm:text-xl md:text-2xl">
            DJs
          </h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base`}>
            Manage R/HOOD DJ members
          </p>
        </div>
        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-brand-green text-brand-black hover:bg-brand-green/90 w-full sm:w-auto"
              onClick={handleInviteMember}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Invite DJ</span>
              <span className="sm:hidden">Invite</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className={textStyles.subheading.large}>
                Invite New DJ
              </DialogTitle>
              <DialogDescription className={textStyles.body.regular}>
                Send an invitation to join the R/HOOD community as a DJ
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className={textStyles.body.regular}>
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter full name"
                  value={inviteFormData.name}
                  onChange={(e) =>
                    setInviteFormData({
                      ...inviteFormData,
                      name: e.target.value,
                    })
                  }
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className={textStyles.body.regular}>
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={inviteFormData.email}
                  onChange={(e) =>
                    setInviteFormData({
                      ...inviteFormData,
                      email: e.target.value,
                    })
                  }
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className={textStyles.body.regular}>
                  Personal Message (Optional)
                </Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message to the invitation..."
                  value={inviteFormData.message}
                  onChange={(e) =>
                    setInviteFormData({
                      ...inviteFormData,
                      message: e.target.value,
                    })
                  }
                  className="bg-secondary border-border text-foreground min-h-[100px]"
                />
              </div>

              <DialogFooter className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleInviteCancel}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-brand-green text-brand-black hover:bg-brand-green/90"
                  disabled={!inviteFormData.name || !inviteFormData.email}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Invite
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search DJs, locations, or genres..."
            className="pl-10 bg-secondary border-border text-foreground w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:space-x-2">
          <Button
            variant="outline"
            size="sm"
            className={`text-xs sm:text-sm ${
              activeFilter === "all"
                ? "bg-brand-green text-brand-black hover:bg-brand-green/90"
                : ""
            }`}
            onClick={() => setActiveFilter("all")}
          >
            All
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`text-xs sm:text-sm ${
              activeFilter === "active"
                ? "bg-brand-green text-brand-black hover:bg-brand-green/90"
                : ""
            }`}
            onClick={() => setActiveFilter("active")}
          >
            Active
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`text-xs sm:text-sm ${
              activeFilter === "inactive"
                ? "bg-brand-green text-brand-black hover:bg-brand-green/90"
                : ""
            }`}
            onClick={() => setActiveFilter("inactive")}
          >
            Inactive
          </Button>
        </div>

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="min-w-[140px] text-xs sm:text-sm w-full sm:w-auto">
              <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="hidden sm:inline">
                {sortBy === "date_joined_newest" && "Newest First"}
                {sortBy === "date_joined_oldest" && "Oldest First"}
                {sortBy === "last_active_newest" && "Recently Active"}
                {sortBy === "last_active_oldest" && "Least Active"}
              </span>
              <span className="sm:hidden">Sort</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem
              onClick={() => setSortBy("date_joined_newest")}
              className="flex items-center"
            >
              <ArrowDown className="h-4 w-4 mr-2" />
              Date Joined (Newest)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortBy("date_joined_oldest")}
              className="flex items-center"
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Date Joined (Oldest)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortBy("last_active_newest")}
              className="flex items-center"
            >
              <ArrowDown className="h-4 w-4 mr-2" />
              Last Active (Recent)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortBy("last_active_oldest")}
              className="flex items-center"
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Last Active (Oldest)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
          </div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>No DJs found.</p>
          </div>
        ) : (
          filteredMembers.map((member: DjMember) => (
            <Card key={member.id} className="bg-card border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    {/* Avatar with Profile Image */}
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

                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`${textStyles.subheading.large} text-base sm:text-lg truncate`}>
                          {member.djName || member.name}
                        </h3>
                        <div className="flex items-center flex-shrink-0">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 mr-1" />
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {member.rating}
                          </span>
                        </div>
                      </div>

                      <p
                        className={`${textStyles.body.regular} text-muted-foreground text-xs sm:text-sm truncate`}
                      >
                        {member.email}
                      </p>

                      {/* Metadata Row */}
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
                    </div>
                  </div>

                  {/* Right Side - Actions */}
                  <div className="flex flex-wrap items-center gap-2 sm:space-x-2">
                    <div className="w-full sm:w-auto">
                      {getStatusBadge(member.status)}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-foreground text-xs sm:text-sm flex-1 sm:flex-initial"
                      onClick={() =>
                        router.push(`/admin/members/${member.id}`)
                      }
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">View Details</span>
                      <span className="sm:hidden">View</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm flex-1 sm:flex-initial"
                      onClick={() => handleMessageMember(member)}
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
                      <DropdownMenuContent
                        align="end"
                        className="bg-card border-border"
                      >
                        <DropdownMenuItem
                          onClick={() =>
                            handleDeleteMember(member.id, member.name)
                          }
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
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle
              className={`${textStyles.subheading.large} text-brand-white`}
            >
              Delete DJ
            </DialogTitle>
            <DialogDescription className={textStyles.body.regular}>
              Are you sure you want to delete &quot;{memberToDelete?.name}
              &quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDeleteMember}
              className="text-foreground border-border hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteMember}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Modal */}
      <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
        <DialogContent className="bg-brand-black border-brand-green/20 text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-brand-green font-bold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Message DJ
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedMember &&
                `Sending message to ${selectedMember.name} (${selectedMember.email})`}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="message-text" className={textStyles.body.regular}>
              Message
            </Label>
            <Textarea
              id="message-text"
              placeholder="Enter your message..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="bg-secondary border-border text-foreground min-h-[150px] mt-2"
            />
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMessageModalOpen(false);
                setMessageContent("");
                setSelectedMember(null);
              }}
              className="border-border text-foreground hover:bg-secondary"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSendMessage}
              className="bg-brand-green text-brand-black hover:bg-brand-green/90"
              disabled={!messageContent.trim()}
            >
              <Mail className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
