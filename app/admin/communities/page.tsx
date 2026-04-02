"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Search,
  Users,
  MessageSquare,
  Calendar,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { textStyles } from "@/lib/typography";
import {
  fetchCommunitiesListWithStats,
  type CommunityListItem,
  type CommunitiesListStats,
} from "@/lib/communities/fetch-communities-list";
import { deleteCommunityCascade } from "@/lib/communities/community-detail-api";
import { CommunityListRow } from "@/components/admin/community-list-row";

const emptyStats: CommunitiesListStats = {
  totalCommunities: 0,
  totalMembersPlatform: 0,
  activeCommunities: 0,
  createdThisMonth: 0,
};

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<CommunityListItem[]>([]);
  const [stats, setStats] = useState<CommunitiesListStats>(emptyStats);
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

  const loadList = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchCommunitiesListWithStats();
      if (!result.ok) {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch communities",
          variant: "destructive",
        });
        return;
      }
      setCommunities(result.communities);
      setStats(result.stats);
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const openDeleteDialog = (communityId: string, communityName: string) => {
    setCommunityToDelete({ id: communityId, name: communityName });
    setDeleteDialogOpen(true);
  };

  const handleDeleteCommunity = async () => {
    if (!communityToDelete || isDeleting) return;
    const id = communityToDelete.id;

    try {
      setIsDeleting(true);
      const result = await deleteCommunityCascade(id);

      if (!result.ok) {
        toast({
          title: "Error",
          description: `Failed to delete community: ${result.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Community deleted successfully",
      });

      setDeleteDialogOpen(false);
      setCommunityToDelete(null);
      await loadList();
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCommunities = useMemo(
    () =>
      communities.filter(
        (community) =>
          community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (community.description &&
            community.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      ),
    [communities, searchTerm]
  );

  useEffect(() => {
    loadList();
  }, [loadList]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-blur-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white text-lg sm:text-xl md:text-2xl">
            COMMUNITIES
          </h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base`}>
            Manage group chats and community discussions
          </p>
        </div>
        <Button
          className="bg-brand-green hover:bg-brand-green/90 text-brand-black w-full sm:w-auto"
          onClick={() => router.push("/admin/communities/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Create Community</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Communities
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalCommunities}
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
                  {stats.totalMembersPlatform}
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
                  {stats.activeCommunities}
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
                  {stats.createdThisMonth}
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search communities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

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
            <CommunityListRow
              key={community.id}
              community={community}
              formatDate={formatDate}
              onView={(id) => router.push(`/admin/communities/${id}`)}
              onEdit={(id) =>
                router.push(`/admin/communities/${id}/edit`)
              }
              onDelete={openDeleteDialog}
            />
          ))}
        </div>
      )}

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
              ? This action cannot be undone and will permanently remove the
              community and all its messages.
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
