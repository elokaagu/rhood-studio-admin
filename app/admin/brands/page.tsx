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
import { formatDate } from "@/lib/date-utils";
import {
  Search,
  MapPin,
  Calendar,
  Mail,
  UserPlus,
  X,
  Trash2,
  MoreVertical,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Briefcase,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Building2,
} from "lucide-react";

export default function BrandsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_joined_newest");
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
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [messageContent, setMessageContent] = useState("");
  const [totalStats, setTotalStats] = useState({
    totalBrands: 0,
    totalOpportunities: 0,
    totalApplications: 0,
    totalPending: 0,
  });

  // Get sort order based on current sort option
  const getSortOrder = () => {
    switch (sortBy) {
      case "date_joined_newest":
        return { column: "created_at", ascending: false };
      case "date_joined_oldest":
        return { column: "created_at", ascending: true };
      case "last_active_newest":
        return { column: "updated_at", ascending: false };
      case "last_active_oldest":
        return { column: "updated_at", ascending: true };
      default:
        return { column: "created_at", ascending: false };
    }
  };

  // Fetch Brands from database (filter for brands only) with activity stats
  const fetchMembers = async () => {
    try {
      const sortOrder = getSortOrder();
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("role", "brand")
        .order(sortOrder.column, { ascending: sortOrder.ascending });

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
        // Fetch activity stats for each brand
        const transformedMembers = await Promise.all(
          (data || []).map(async (member: any) => {
            // Get opportunities created by this brand
            const { count: opportunitiesCount } = await supabase
              .from("opportunities")
              .select("*", { count: "exact", head: true })
              .eq("organizer_id", member.id);

            // Get opportunity IDs for this brand
            const { data: brandOpportunities } = await supabase
              .from("opportunities")
              .select("id")
              .eq("organizer_id", member.id);

            const opportunityIds = brandOpportunities?.map((opp) => opp.id) || [];

            // Get applications for this brand's opportunities
            let totalApplications = 0;
            let pendingApplications = 0;
            let approvedApplications = 0;
            let rejectedApplications = 0;

            if (opportunityIds.length > 0) {
              const { count: totalApps } = await supabase
                .from("applications")
                .select("*", { count: "exact", head: true })
                .in("opportunity_id", opportunityIds);
              totalApplications = totalApps || 0;

              const { count: pendingApps } = await supabase
                .from("applications")
                .select("*", { count: "exact", head: true })
                .in("opportunity_id", opportunityIds)
                .eq("status", "pending");
              pendingApplications = pendingApps || 0;

              const { count: approvedApps } = await supabase
                .from("applications")
                .select("*", { count: "exact", head: true })
                .in("opportunity_id", opportunityIds)
                .eq("status", "approved");
              approvedApplications = approvedApps || 0;

              const { count: rejectedApps } = await supabase
                .from("applications")
                .select("*", { count: "exact", head: true })
                .in("opportunity_id", opportunityIds)
                .eq("status", "rejected");
              rejectedApplications = rejectedApps || 0;
            }

            // Get most recent opportunity
            const { data: recentOpportunity } = await supabase
              .from("opportunities")
              .select("title, created_at")
              .eq("organizer_id", member.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              id: member.id,
              name: member.brand_name || `${member.first_name} ${member.last_name}`,
              email: member.email,
              location: member.city,
              joinedDate: member.created_at
                ? (() => {
                    const formatted = formatDate(member.created_at);
                    return formatted === "Invalid Date" ? "Unknown" : formatted;
                  })()
                : "Unknown",
              status: "active", // Default status
              lastActive: member.updated_at
                ? (() => {
                    const formatted = formatDate(member.updated_at);
                    return formatted === "Invalid Date" ? "Unknown" : formatted;
                  })()
                : "Unknown",
              brandName: member.brand_name,
              bio: member.bio,
              profileImageUrl: member.profile_image_url,
              // Activity stats
              opportunitiesCount: opportunitiesCount || 0,
              totalApplications: totalApplications,
              pendingApplications: pendingApplications,
              approvedApplications: approvedApplications,
              rejectedApplications: rejectedApplications,
              recentOpportunity: recentOpportunity?.title || null,
              recentOpportunityDate: recentOpportunity?.created_at
                ? formatDate(recentOpportunity.created_at)
                : null,
            };
          })
        );

        setMembers(transformedMembers);
        
        // Calculate total stats
        const stats = transformedMembers.reduce(
          (acc, member) => ({
            totalBrands: acc.totalBrands + 1,
            totalOpportunities: acc.totalOpportunities + (member.opportunitiesCount || 0),
            totalApplications: acc.totalApplications + (member.totalApplications || 0),
            totalPending: acc.totalPending + (member.pendingApplications || 0),
          }),
          { totalBrands: 0, totalOpportunities: 0, totalApplications: 0, totalPending: 0 }
        );
        setTotalStats(stats);
        
        setIsLoading(false);
        return; // Exit early if successful
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast({
        title: "Database Error",
        description: "Failed to load brands from database. Using demo data.",
        variant: "destructive",
      });
    }

    // Fallback to demo data
    setIsLoading(false);
  };

  // Load members on component mount and when sorting changes
  useEffect(() => {
    fetchMembers();
  }, [sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

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
      (member.brandName && member.brandName.toLowerCase().includes(searchTerm.toLowerCase()));

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

  const handleMessageMember = (member: any) => {
    setSelectedMember(member);
    setMessageContent("");
    setMessageModalOpen(true);
  };

  const handleSendMessage = () => {
    if (!messageContent.trim() || !selectedMember) return;

    // Open mailto link with the message
    const subject = encodeURIComponent(`Message from R/HOOD Admin`);
    const body = encodeURIComponent(messageContent);
    window.location.href = `mailto:${selectedMember.email}?subject=${subject}&body=${body}`;

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
      console.log("Deleting brand:", memberToDelete.id, memberToDelete.name);

      // Direct deletion approach - handle foreign key constraints step by step
      console.log("Starting step-by-step deletion...");

      // Step 1: Delete from community_members
      const { error: communityMembersError } = await supabase
        .from("community_members")
        .delete()
        .eq("user_id", memberToDelete.id);

      if (communityMembersError) {
        console.error(
          "Error deleting community members:",
          communityMembersError
        );
      }

      // Step 2: Delete from messages
      const { error: messagesError } = await supabase
        .from("messages")
        .delete()
        .eq("sender_id", memberToDelete.id);

      if (messagesError) {
        console.error("Error deleting messages:", messagesError);
      }

      // Step 3: Delete from applications
      const { error: applicationsError } = await supabase
        .from("applications")
        .delete()
        .eq("user_id", memberToDelete.id);

      if (applicationsError) {
        console.error("Error deleting applications:", applicationsError);
      }

      // Step 4: Delete from message_threads
      console.log("Step 4: Deleting from message_threads...");
      const { error: messageThreadsError1 } = await supabase
        .from("message_threads" as any)
        .delete()
        .eq("participant_1", memberToDelete.id);

      if (messageThreadsError1) {
        console.error(
          "Error deleting message_threads (participant_1):",
          messageThreadsError1
        );
      }

      const { error: messageThreadsError2 } = await supabase
        .from("message_threads" as any)
        .delete()
        .eq("participant_2", memberToDelete.id);

      if (messageThreadsError2) {
        console.error(
          "Error deleting message_threads (participant_2):",
          messageThreadsError2
        );
      }

      // Step 5: Delete from connections
      console.log("Step 5: Deleting from connections...");
      const { error: connectionsError1 } = await supabase
        .from("connections" as any)
        .delete()
        .eq("follower_id", memberToDelete.id);

      if (connectionsError1) {
        console.error(
          "Error deleting connections (follower_id):",
          connectionsError1
        );
      }

      const { error: connectionsError2 } = await supabase
        .from("connections" as any)
        .delete()
        .eq("following_id", memberToDelete.id);

      if (connectionsError2) {
        console.error(
          "Error deleting connections (following_id):",
          connectionsError2
        );
      }

      // Step 6: Delete user profile
      console.log("Step 6: Attempting to delete user profile...");
      const { data: deletedData, error: userProfileError } = await supabase
        .from("user_profiles")
        .delete()
        .eq("id", memberToDelete.id)
        .select();

      if (userProfileError) {
        console.error("Error deleting user profile:", userProfileError);

        if (
          userProfileError.message &&
          userProfileError.message.includes("foreign key")
        ) {
          throw new Error(
            `Unable to delete brand due to database constraints. ` +
              `Please use the manual deletion script: ` +
              `Run the SQL commands in manual-user-deletion.sql in your Supabase dashboard, ` +
              `replacing 'USER_ID_HERE' with: ${memberToDelete.id}`
          );
        } else {
          throw userProfileError;
        }
      } else {
        console.log("User profile deleted successfully");
      }

      console.log("Deletion completed successfully:", deletedData);

      // Remove from local state immediately
      setMembers((prevMembers) =>
        prevMembers.filter((member) => member.id !== memberToDelete.id)
      );

      toast({
        title: "Brand Deleted",
        description: `"${memberToDelete.name}" has been deleted successfully.`,
      });
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast({
        title: "Delete Failed",
        description: `Failed to delete brand: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
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
    <div className="space-y-4 sm:space-y-6 animate-blur-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white text-lg sm:text-xl md:text-2xl">
            BRANDS
          </h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base`}>
            View brand activity, opportunities, and applications
          </p>
        </div>
        <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-brand-green text-brand-black hover:bg-brand-green/90 w-full sm:w-auto"
              onClick={handleInviteMember}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Invite Brand</span>
              <span className="sm:hidden">Invite</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className={textStyles.subheading.large}>
                Invite New Brand
              </DialogTitle>
              <DialogDescription className={textStyles.body.regular}>
                Send an invitation to join the R/HOOD community as a brand
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className={textStyles.body.regular}>
                  Brand Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter brand name"
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

      {/* Summary Stats */}
      {!isLoading && members.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${textStyles.body.small} text-muted-foreground`}>Total Brands</p>
                  <p className={`${textStyles.headline.section} text-foreground mt-1`}>
                    {totalStats.totalBrands}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-brand-green opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${textStyles.body.small} text-muted-foreground`}>Opportunities</p>
                  <p className={`${textStyles.headline.section} text-foreground mt-1`}>
                    {totalStats.totalOpportunities}
                  </p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${textStyles.body.small} text-muted-foreground`}>Applications</p>
                  <p className={`${textStyles.headline.section} text-foreground mt-1`}>
                    {totalStats.totalApplications}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${textStyles.body.small} text-muted-foreground`}>Pending</p>
                  <p className={`${textStyles.headline.section} text-foreground mt-1`}>
                    {totalStats.totalPending}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:space-x-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search brands, locations..."
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
            <p className={textStyles.body.regular}>Loading brands...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>No brands found.</p>
          </div>
        ) : (
          filteredMembers.map((member) => (
            <Card key={member.id} className="bg-card border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    {/* Avatar with Profile Image */}
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 bg-brand-green flex-shrink-0">
                      <AvatarImage
                        src={member.profileImageUrl}
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
                          {member.brandName || member.name}
                        </h3>
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

                      {/* Activity Stats Row */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-1 text-xs sm:text-sm">
                          <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 text-brand-green" />
                          <span className="text-foreground font-semibold">{member.opportunitiesCount || 0}</span>
                          <span className="text-muted-foreground">Opportunities</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs sm:text-sm">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                          <span className="text-foreground font-semibold">{member.totalApplications || 0}</span>
                          <span className="text-muted-foreground">Applications</span>
                        </div>
                        {member.pendingApplications > 0 && (
                          <div className="flex items-center gap-1 text-xs sm:text-sm">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                            <span className="text-foreground font-semibold">{member.pendingApplications}</span>
                            <span className="text-muted-foreground">Pending</span>
                          </div>
                        )}
                        {member.approvedApplications > 0 && (
                          <div className="flex items-center gap-1 text-xs sm:text-sm">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                            <span className="text-foreground font-semibold">{member.approvedApplications}</span>
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
                        (window.location.href = `/admin/members/${member.id}`)
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
              Delete Brand
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

      {/* Message Modal */}
      <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
        <DialogContent className="bg-brand-black border-brand-green/20 text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-brand-green font-bold flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Message Brand
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
