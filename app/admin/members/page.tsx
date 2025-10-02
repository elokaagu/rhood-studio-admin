"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  Music,
  Calendar,
  User,
  Mail,
  Star,
  UserPlus,
  X,
  Trash2,
  MoreVertical,
  Eye,
} from "lucide-react";

export default function MembersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Fetch members from database
  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        // Check if it's a table doesn't exist error
        if (
          error.message?.includes("relation") &&
          error.message?.includes("does not exist")
        ) {
          console.warn(
            "User profiles table doesn't exist yet. Using demo data."
          );
          toast({
            title: "Database Setup Required",
            description:
              "User profiles table not found. Please create it in Supabase dashboard. Using demo data for now.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        // Transform the data to match the expected format
        const transformedMembers =
          data?.map((member: any) => ({
            id: member.id,
            name: `${member.first_name} ${member.last_name}`,
            email: member.email,
            location: member.city,
            joinedDate: member.created_at
              ? new Date(member.created_at).toISOString().split("T")[0]
              : "Unknown",
            gigs: 0, // This field might need to be calculated from applications
            rating: 0.0, // This field might need to be calculated from feedback
            genres: member.genres || [],
            status: "active", // Default status
            lastActive: "Unknown", // This field might need to be tracked
            djName: member.dj_name,
            bio: member.bio,
            instagram: member.instagram,
            soundcloud: member.soundcloud,
            profileImageUrl: member.profile_image_url,
          })) || [];

        setMembers(transformedMembers);
        setIsLoading(false);
        return; // Exit early if successful
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({
        title: "Database Error",
        description: "Failed to load members from database. Using demo data.",
        variant: "destructive",
      });
    }

    // Fallback to demo data
    setMembers([
      {
        id: 1,
        name: "Alex Thompson",
        email: "alex@example.com",
        location: "London, UK",
        joinedDate: "2024-01-15",
        gigs: 12,
        rating: 4.8,
        genres: ["Techno", "House"],
        status: "active",
        lastActive: "2 hours ago",
      },
      {
        id: 2,
        name: "Maya Rodriguez",
        email: "maya@example.com",
        location: "Berlin, Germany",
        joinedDate: "2024-02-03",
        gigs: 18,
        rating: 4.9,
        genres: ["Techno", "Industrial"],
        status: "active",
        lastActive: "1 day ago",
      },
      {
        id: 3,
        name: "Kai Johnson",
        email: "kai@example.com",
        location: "Amsterdam, Netherlands",
        joinedDate: "2024-03-12",
        gigs: 8,
        rating: 4.7,
        genres: ["Drum & Bass", "Techno"],
        status: "active",
        lastActive: "3 hours ago",
      },
      {
        id: 4,
        name: "Sofia Martinez",
        email: "sofia@example.com",
        location: "Barcelona, Spain",
        joinedDate: "2024-04-20",
        gigs: 15,
        rating: 4.6,
        genres: ["Deep House", "Melodic Techno"],
        status: "inactive",
        lastActive: "2 weeks ago",
      },
      {
        id: 5,
        name: "Chen Wei",
        email: "chen@example.com",
        location: "Tokyo, Japan",
        joinedDate: "2024-05-08",
        gigs: 6,
        rating: 4.5,
        genres: ["Minimal", "Ambient"],
        status: "active",
        lastActive: "5 minutes ago",
      },
    ]);

    setIsLoading(false);
  };

  // Load members on component mount
  useEffect(() => {
    fetchMembers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  // Filter members based on search term and active filter
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.genres.some((genre: string) =>
        genre.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesFilter =
      activeFilter === "all" || member.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const handleInviteMember = () => {
    setIsInviteModalOpen(true);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // In a real app, this would send the invite to the backend
      // For now, we'll just show a success message
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

  const handleMessageMember = (memberName: string, memberEmail: string) => {
    // In a real app, this would open a messaging interface
    console.log(`Opening message interface for ${memberName} (${memberEmail})`);
    // For now, we'll open the default email client
    window.location.href = `mailto:${memberEmail}`;
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    setMemberToDelete({ id: memberId, name: memberName });
    setDeleteModalOpen(true);
  };

  const confirmDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      console.log("Deleting member:", memberToDelete.id, memberToDelete.name);

      // First, delete related records that might have foreign key constraints
      // Delete from community_members table
      const { error: communityMembersError } = await supabase
        .from("community_members")
        .delete()
        .eq("user_id", memberToDelete.id);

      if (communityMembersError) {
        console.error("Error deleting community members:", communityMembersError);
        // Continue with user deletion even if this fails
      }

      // Delete from messages table
      const { error: messagesError } = await supabase
        .from("messages")
        .delete()
        .eq("sender_id", memberToDelete.id);

      if (messagesError) {
        console.error("Error deleting messages:", messagesError);
        // Continue with user deletion even if this fails
      }

      // Delete from applications table
      const { error: applicationsError } = await supabase
        .from("applications")
        .delete()
        .eq("user_id", memberToDelete.id);

      if (applicationsError) {
        console.error("Error deleting applications:", applicationsError);
        // Continue with user deletion even if this fails
      }

      // Finally, delete the user profile
      const { data: deletedData, error } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", memberToDelete.id)
        .select();

      if (error) {
        console.error("Error deleting user profile:", error);
        throw error;
      }

      console.log("Member deleted successfully from database:", deletedData);

      // Remove from local state immediately
      setMembers((prevMembers) =>
        prevMembers.filter((member) => member.id !== memberToDelete.id)
      );

      toast({
        title: "Member Deleted",
        description: `"${memberToDelete.name}" has been deleted successfully.`,
      });

      // Verify deletion by checking if member still exists
      const { data: verifyData, error: verifyError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", memberToDelete.id)
        .single();

      if (verifyError && verifyError.code === 'PGRST116') {
        // Member not found - deletion successful
        console.log("Deletion verified: Member no longer exists");
      } else if (verifyData) {
        // Member still exists - deletion failed
        console.log("Deletion failed: Member still exists", verifyData);
        toast({
          title: "Error",
          description: "Member deletion failed. Please try again.",
          variant: "destructive",
        });
        return;
      }

    } catch (error) {
      console.error("Error deleting member:", error);
      toast({
        title: "Delete Failed",
        description: `Failed to delete member: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setDeleteModalOpen(false);
      setMemberToDelete(null);
    }
  };

  const cancelDeleteMember = () => {
    setDeleteModalOpen(false);
    setMemberToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
            MEMBERS
          </h1>
          <p className={textStyles.body.regular}>
            Manage R/HOOD community members
          </p>
        </div>
        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-brand-green text-brand-black hover:bg-brand-green/90"
              onClick={handleInviteMember}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className={textStyles.subheading.large}>
                Invite New Member
              </DialogTitle>
              <DialogDescription className={textStyles.body.regular}>
                Send an invitation to join the R/HOOD community
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
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search members, locations, or genres..."
            className="pl-10 bg-secondary border-border text-foreground"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className={
              activeFilter === "all"
                ? "bg-brand-green text-brand-black hover:bg-brand-green/90"
                : ""
            }
            onClick={() => setActiveFilter("all")}
          >
            All
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={
              activeFilter === "active"
                ? "bg-brand-green text-brand-black hover:bg-brand-green/90"
                : ""
            }
            onClick={() => setActiveFilter("active")}
          >
            Active
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={
              activeFilter === "inactive"
                ? "bg-brand-green text-brand-black hover:bg-brand-green/90"
                : ""
            }
            onClick={() => setActiveFilter("inactive")}
          >
            Inactive
          </Button>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>Loading members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>No members found.</p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <Card key={member.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Avatar with Initials */}
                    <Avatar className="h-12 w-12 bg-brand-green">
                      <AvatarFallback className="text-brand-black font-bold">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Member Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className={textStyles.subheading.large}>
                          {member.name}
                        </h3>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm text-muted-foreground">
                            {member.rating}
                          </span>
                        </div>
                      </div>

                      <p
                        className={`${textStyles.body.regular} text-muted-foreground`}
                      >
                        {member.email}
                      </p>

                      {/* Metadata Row */}
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {member.location}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Joined {member.joinedDate}
                        </div>
                        <div className="flex items-center">
                          <Music className="h-4 w-4 mr-1" />
                          {member.gigs} gigs
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Tags and Actions */}
                  <div className="flex items-center space-x-2">
                    {member.genres.map((genre: string) => (
                      <div key={genre}>{getGenreBadge(genre)}</div>
                    ))}
                    {getStatusBadge(member.status)}

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-foreground"
                      onClick={() =>
                        (window.location.href = `/admin/members/${member.id}`)
                      }
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleMessageMember(member.name, member.email)
                      }
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Message
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreVertical className="h-4 w-4" />
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
              onClick={cancelDeleteMember}
              className="text-foreground border-border hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteMember}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
