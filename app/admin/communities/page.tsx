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
        data?.map((community) => ({
          ...community,
          creator_name: community.creator
            ? `${community.creator.first_name} ${community.creator.last_name}`
            : "Unknown",
          creator_avatar: community.creator?.profile_image_url || null,
        })) || [];

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

  // Delete community
  const handleDeleteCommunity = async (
    communityId: string,
    communityName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete "${communityName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("communities")
        .delete()
        .eq("id", communityId);

      if (error) {
        console.error("Error deleting community:", error);
        toast({
          title: "Error",
          description: "Failed to delete community",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Community deleted successfully",
      });

      // Refresh the list
      fetchCommunities();
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
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
              <div className="h-8 w-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-500" />
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
              <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-green-500" />
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
              <div className="h-8 w-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-purple-500" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardHeader>
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => (
            <Card
              key={community.id}
              className="bg-card border-border hover:border-primary/50 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
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
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                          <MessageSquare className="h-6 w-6 text-primary" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <CardTitle
                        className={`${textStyles.subheading.regular} truncate`}
                      >
                        {community.name}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {community.member_count || 0} members
                        </span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
                          handleDeleteCommunity(community.id, community.name)
                        }
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {community.description && (
                  <p
                    className={`${textStyles.body.small} text-muted-foreground mb-3 line-clamp-2`}
                  >
                    {community.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-2">
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

                <div className="mt-4 flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
