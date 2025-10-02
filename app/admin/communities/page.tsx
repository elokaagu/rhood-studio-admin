"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Search,
  Users,
  MessageSquare,
  Calendar,
  Settings,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { textStyles } from "@/lib/typography";
import Image from "next/image";

interface Community {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  member_count: number | null;
  created_at: string | null;
  created_by: string | null;
  creator_name?: string;
  creator_avatar?: string | null;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [communityToDelete, setCommunityToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Fetch communities with creator information
  const fetchCommunities = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("communities")
        .select(
          `
          *,
            creator:user_profiles!communities_created_by_fkey(
              id,
              first_name,
              last_name,
              profile_image_url
            )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching communities:", error);
        toast({
          title: "Error",
          description: "Failed to fetch communities",
          variant: "destructive",
        });
        return;
      }

      // Transform the data to include creator information
      const transformedCommunities =
        data?.map((community) => {
          console.log('Community data:', community.name, {
            id: community.id,
            image_url: community.image_url,
            has_image: !!community.image_url,
            image_type: typeof community.image_url
          });
          return {
            ...community,
            creator_name: community.creator
              ? `${community.creator.first_name} ${community.creator.last_name}`
              : "Unknown",
            creator_avatar: community.creator?.profile_image_url || null,
          };
        }) || [];

      console.log('Fetched communities count:', transformedCommunities.length);
      console.log('Community IDs:', transformedCommunities.map(c => c.id));
      setCommunities(transformedCommunities);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Open delete dialog
  const openDeleteDialog = (communityId: string, communityName: string) => {
    setCommunityToDelete({ id: communityId, name: communityName });
    setDeleteDialogOpen(true);
  };

  // Delete community
  const handleDeleteCommunity = async () => {
    if (!communityToDelete || isDeleting) return;

    try {
      setIsDeleting(true);
      console.log("Deleting community:", communityToDelete.id);

      // First, delete related community members
      const { error: membersError } = await supabase
        .from("community_members")
        .delete()
        .eq("community_id", communityToDelete.id);

      if (membersError) {
        console.error("Error deleting community members:", membersError);
        // Continue with community deletion even if members deletion fails
      }

      // Delete the community
      const { error } = await supabase
        .from("communities")
        .delete()
        .eq("id", communityToDelete.id)
        .select();

      if (error) {
        console.error("Error deleting community:", error);
        toast({
          title: "Error",
          description: `Failed to delete community: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log("Community deleted successfully from database");

      toast({
        title: "Success",
        description: "Community deleted successfully",
      });

      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setCommunityToDelete(null);
      
      // Small delay to ensure database consistency, then refresh
      setTimeout(async () => {
        await fetchCommunities();
      }, 500);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter communities based on search term
  const filteredCommunities = communities.filter(
    (community) =>
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (community.description &&
        community.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
            COMMUNITIES
          </h1>
          <p className={textStyles.body.regular}>
            Manage group chats and community discussions
          </p>
        </div>
        <Button
          className="bg-brand-green hover:bg-brand-green/90 text-brand-black"
          onClick={() => router.push("/admin/communities/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Community
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Communities
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {communities.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold text-foreground">
                  {communities.reduce(
                    (sum, community) => sum + (community.member_count || 0),
                    0
                  )}
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Active Communities
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {communities.filter((c) => (c.member_count || 0) > 0).length}
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    communities.filter((c) => {
                      const createdDate = new Date(c.created_at || "");
                      const now = new Date();
                      return (
                        createdDate.getMonth() === now.getMonth() &&
                        createdDate.getFullYear() === now.getFullYear()
                      );
                    }).length
                  }
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Communities List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCommunities.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {searchTerm ? "No communities found" : "No communities yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Create your first community to get started"}
            </p>
            {!searchTerm && (
              <Button
                className="bg-brand-green hover:bg-brand-green/90 text-brand-black"
                onClick={() => router.push("/admin/communities/create")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Community
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCommunities.map((community) => (
            <Card
              key={community.id}
              className="bg-card border-border hover:border-primary/50 transition-colors"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {/* Community Avatar */}
                    <div className="flex-shrink-0">
                      {community.image_url ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden">
                          <Image
                            src={community.image_url}
                            alt={community.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized={true}
                            onError={(e) => {
                              console.error('Community avatar load error:', community.name, community.image_url);
                              console.error('Error event:', e);
                            }}
                            onLoad={() => {
                              console.log('Community avatar loaded successfully:', community.name, community.image_url);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-brand-green/20 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-6 w-6 text-brand-green" />
                        </div>
                      )}
                    </div>

                    {/* Community Info */}
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
                            {community.member_count || 0} members
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

                    {/* Actions */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/communities/${community.id}`)
                        }
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        View Chat
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/communities/${community.id}/edit`)
                        }
                      >
                        <Settings className="h-3 w-3" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/admin/communities/${community.id}/edit`
                              )
                            }
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/admin/communities/${community.id}`)
                            }
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View Messages
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              openDeleteDialog(
                                community.id,
                                community.name
                              )
                            }
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
          ))}
        </div>
      )}

      {/* R/HOOD Themed Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border/50 backdrop-blur-sm shadow-2xl max-w-md">
          <AlertDialogHeader className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-brand-green" />
              </div>
              <AlertDialogTitle className="font-ts-block ts-lg uppercase text-brand-white tracking-wide">
                Delete Community
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="font-helvetica-regular helvetica-base text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-helvetica-bold text-brand-white">
                &quot;{communityToDelete?.name}&quot;
              </span>
              ? This action cannot be undone and will permanently remove the community and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="space-x-3">
            <AlertDialogCancel 
              className="border-border/50 text-brand-white hover:bg-muted/50 hover:border-brand-green/50 font-helvetica-regular helvetica-base transition-all duration-300"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-helvetica-bold helvetica-base shadow-glow-primary transition-all duration-300"
              onClick={handleDeleteCommunity}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive-foreground mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete Community"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
