"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  Music,
  Star,
  User,
  Edit,
  Trash2,
  MoreVertical,
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

export default function MemberDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id;
  const { toast } = useToast();
  const [member, setMember] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Fetch member from database
  const fetchMember = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", memberId as string)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Transform the data to match the expected format
        const transformedMember = {
          id: data.id,
          name:
            data.dj_name || `${data.first_name} ${data.last_name}` || "Unknown",
          email: data.email || "No email",
          location: data.city || "Unknown",
          joinDate: data.created_at
            ? new Date(data.created_at).toISOString().split("T")[0]
            : "Unknown",
          genres: data.genres || [],
          status: "active", // Default to active since is_active field doesn't exist in schema
          gigs: 0, // This would need to be calculated from applications
          bio: data.bio || "No bio available",
          phone: "No phone", // Phone field doesn't exist in database schema
          socialLinks: {
            instagram: data.instagram || "",
            soundcloud: data.soundcloud || "",
          },
        };

        setMember(transformedMember);
        setIsLoading(false);
        return; // Exit early if successful
      }
    } catch (error) {
      console.error("Error fetching member:", error);
      toast({
        title: "Database Error",
        description: "Failed to load member from database. Using demo data.",
        variant: "destructive",
      });
    }

    // Fallback to demo data
    const members = [
      {
        id: 1,
        name: "Eloka Agu",
        email: "eloka.agu@icloud.com",
        location: "San Francisco",
        joinDate: "2025-09-22",
        genres: ["HOUSE", "DRUM & BASS"],
        status: "active",
        gigs: 0,
        bio: "Passionate DJ and producer with 5+ years of experience in electronic music.",
        phone: "+1 (555) 123-4567",
        socialLinks: {
          instagram: "@elokaagu",
          soundcloud: "elokaagu",
        },
      },
      {
        id: 2,
        name: "Elijah",
        email: "placeholder_bb5bfd41-2512-4260-a9e5-e3d5b64999d9@example.com",
        location: "Los Angeles",
        joinDate: "2025-09-10",
        genres: ["TECHNO"],
        status: "active",
        gigs: 0,
        bio: "Techno enthusiast and underground scene advocate.",
        phone: "+1 (555) 987-6543",
        socialLinks: {
          instagram: "@elijah_techno",
        },
      },
      {
        id: 3,
        name: "Eloka",
        email: "placeholder_af60c46a-6a04-4b1d-b0cb-1313c7adaeb0@example.com",
        location: "Miami",
        joinDate: "2025-09-09",
        genres: ["TECHNO", "TECH HOUSE"],
        status: "active",
        gigs: 0,
        bio: "Miami-based DJ specializing in tech house and techno.",
        phone: "+1 (555) 456-7890",
        socialLinks: {
          instagram: "@eloka_miami",
          twitter: "@eloka_dj",
        },
      },
    ];

    const foundMember = members.find(
      (mem) => mem.id === parseInt(memberId as string)
    );

    setMember(foundMember || members[0]);
    setIsLoading(false);
  };

  // Load member on component mount
  useEffect(() => {
    fetchMember();
  }, [memberId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = () => {
    if (member) {
      setMemberToDelete({ id: memberId as string, name: member.name });
      setDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    try {
      console.log("Deleting member:", memberToDelete.id, memberToDelete.name);

      // Import and use the robust deletion function
      const { deleteMemberRobust } = await import("@/lib/robust-member-deletion");
      
      const result = await deleteMemberRobust(memberToDelete.id);

      if (!result.success) {
        throw new Error(result.error || "Unknown error during deletion");
      }

      console.log("Deletion completed successfully:", result.deletedRecords);

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

      if (verifyError && verifyError.code === "PGRST116") {
        // Member not found - deletion successful
        console.log("Deletion verified: Member no longer exists");
        // Redirect to members list
        router.push("/admin/members");
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
        description: `Failed to delete member: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        variant: "destructive",
      });
    } finally {
      setDeleteModalOpen(false);
      setMemberToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setMemberToDelete(null);
  };

  const handleMessageMember = (memberName: string, memberEmail: string) => {
    // In a real app, this would open a messaging interface
    console.log(`Opening message interface for ${memberName} (${memberEmail})`);
    // For now, we'll open the default email client
    window.location.href = `mailto:${memberEmail}`;
  };

  const getStatusBadge = (status: string) => {
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
          <p className={textStyles.body.regular}>Loading member...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className={textStyles.headline.section}>MEMBER NOT FOUND</h1>
          <p className={textStyles.body.regular}>
            The member you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button
            onClick={() => router.push("/admin/members")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Members
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
            {member.name}
          </h1>
          <p className={textStyles.body.regular}>Member profile and details</p>
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
                  <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-600">
                      {member.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <CardTitle
                      className={`${textStyles.subheading.large} flex items-center`}
                    >
                      {member.name}
                      <Star className="h-4 w-4 ml-2 text-yellow-400" />
                      <span className="text-sm text-muted-foreground ml-1">
                        0
                      </span>
                    </CardTitle>
                    <p className={textStyles.body.regular}>{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(member.status)}
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
                <div className="flex items-center text-sm text-muted-foreground">
                  <Music className="h-4 w-4 mr-2" />
                  {member.gigs} gigs
                </div>
              </div>

              <div className="space-y-2">
                <h3 className={textStyles.subheading.small}>Bio</h3>
                <p className={textStyles.body.regular}>{member.bio}</p>
              </div>

              <div className="space-y-2">
                <h3 className={textStyles.subheading.small}>Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {member.genres.map((genre: string) => (
                    <div key={genre}>{getGenreBadge(genre)}</div>
                  ))}
                </div>
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
                  <p className={textStyles.body.regular}>{member.phone}</p>
                </div>
              </div>

              {Object.keys(member.socialLinks).length > 0 && (
                <div>
                  <h4 className={textStyles.subheading.small}>Social Links</h4>
                  <div className="space-y-2">
                    {Object.entries(member.socialLinks).map(
                      ([platform, handle]) => (
                        <div key={platform} className="flex items-center">
                          <span className="capitalize text-sm text-muted-foreground w-20">
                            {platform}:
                          </span>
                          <span className={textStyles.body.regular}>
                            {handle as string}
                          </span>
                        </div>
                      )
                    )}
                  </div>
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
                onClick={() => handleMessageMember(member.name, member.email)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Message
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
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Music className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className={textStyles.body.regular}>Total Gigs</span>
                </div>
                <span className={textStyles.subheading.small}>
                  {member.gigs}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className={textStyles.body.regular}>Rating</span>
                </div>
                <span className={textStyles.subheading.small}>0.0</span>
              </div>
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
              className="text-foreground border-border hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
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
