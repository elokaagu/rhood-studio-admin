"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { LinkText } from "@/components/ui/link-text";
import { BriefRenderer } from "@/components/ui/brief-renderer";
import Image from "next/image";
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
import {
  deleteOpportunityById,
  fetchOpportunityDetails,
  updateOpportunityArchiveState,
  type OpportunityDetailView,
} from "@/lib/admin/opportunities/opportunity-detail";
import {
  Calendar,
  MapPin,
  Users,
  Edit,
  Trash2,
  ArrowLeft,
  Clock,
  CheckCircle,
  MoreVertical,
  Archive,
  RotateCcw,
  Loader2,
} from "lucide-react";

export default function OpportunityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params.id as string;
  const { toast } = useToast();
  const [opportunity, setOpportunity] = useState<OpportunityDetailView | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoadError(null);
    setNotFound(false);
    setIsLoading(true);
    const result = await fetchOpportunityDetails(opportunityId);

    if (!result.ok) {
      if (result.reason === "forbidden") {
        toast({
          title: "Access denied",
          description: result.message,
          variant: "destructive",
        });
        router.push("/admin/opportunities");
        setIsLoading(false);
        return;
      }
      if (result.reason === "not_found") {
        setOpportunity(null);
        setNotFound(true);
        setIsLoading(false);
        return;
      }
      setOpportunity(null);
      setLoadError(result.message);
      setIsLoading(false);
      return;
    }

    setOpportunity(result.detail);
    setIsLoading(false);
  }, [opportunityId, router, toast]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleDelete = () => {
    if (opportunity) {
      setOpportunityToDelete({
        id: opportunityId,
        title: opportunity.title,
      });
      setDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!opportunityToDelete) return;

    const del = await deleteOpportunityById(opportunityToDelete.id);
    if (!del.ok) {
      toast({
        title: "Delete failed",
        description: del.message,
        variant: "destructive",
      });
      setDeleteModalOpen(false);
      setOpportunityToDelete(null);
      return;
    }

    toast({
      title: "Opportunity deleted",
      description: `"${opportunityToDelete.title}" has been deleted.`,
    });
    setDeleteModalOpen(false);
    setOpportunityToDelete(null);
    router.push("/admin/opportunities");
  };

  const handleArchiveToggle = async (shouldArchive: boolean) => {
    if (!opportunity) return;

    setArchiveLoading(true);
    try {
      const res = await updateOpportunityArchiveState(
        opportunityId,
        shouldArchive
      );
      if (!res.ok) {
        throw new Error(res.message);
      }

      await loadDetail();

      toast({
        title: shouldArchive ? "Opportunity archived" : "Opportunity reopened",
        description: shouldArchive
          ? "Hidden from the app while remaining in the Portal."
          : "Visible to talent in the app again.",
      });
    } catch (error) {
      console.error("Error updating archive status:", error);
      toast({
        title: "Update failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to update visibility.",
        variant: "destructive",
      });
    } finally {
      setArchiveLoading(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setOpportunityToDelete(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "archived":
        return (
          <Badge
            variant="outline"
            className="border-muted-foreground/40 text-muted-foreground bg-transparent text-xs"
          >
            <Archive className="h-3 w-3 mr-1" />
            Archived
          </Badge>
        );
      case "active":
        return (
          <Badge
            variant="outline"
            className="border-gray-400 text-gray-400 bg-transparent text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="outline"
            className="border-gray-400 text-gray-400 bg-transparent text-xs"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "closed":
        return (
          <Badge
            variant="outline"
            className="border-gray-400 text-gray-400 bg-transparent text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            Closed
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-gray-400 text-gray-400 bg-transparent text-xs"
          >
            {status}
          </Badge>
        );
    }
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

  if (loadError) {
    return (
      <div className="space-y-6 max-w-lg mx-auto text-center">
        <h1 className={textStyles.headline.section}>Could not load opportunity</h1>
        <p className={`${textStyles.body.regular} text-muted-foreground`}>
          {loadError}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => loadDetail()}>
            Retry
          </Button>
          <Button onClick={() => router.push("/admin/opportunities")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to opportunities
          </Button>
        </div>
      </div>
    );
  }

  if (notFound || !opportunity) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className={textStyles.headline.section}>OPPORTUNITY NOT FOUND</h1>
          <p className={textStyles.body.regular}>
            The opportunity you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access.
          </p>
          <Button
            onClick={() => router.push("/admin/opportunities")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>
        </div>
      </div>
    );
  }

  const badgeStatus = opportunity.is_archived
    ? "archived"
    : opportunity.displayStatus;

  return (
    <div className="space-y-6 animate-blur-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/opportunities")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className={textStyles.headline.section}>OPPORTUNITY DETAILS</h1>
            <p className={textStyles.body.regular}>
              View and manage opportunity information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/admin/opportunities/${opportunityId}/edit`)
            }
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {opportunity.eventPastDue && (
        <div
          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100"
          role="status"
        >
          This event window has passed. Use{" "}
          <span className="font-medium">Mark as Filled (Archive)</span> below if
          it should no longer appear in the app.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className={textStyles.subheading.large}>
                    {opportunity.title}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    {getStatusBadge(badgeStatus)}
                    {opportunity.genre && (
                      <Badge
                        variant="outline"
                        className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase"
                      >
                        {opportunity.genre}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {opportunity.image_url && (
                <div className="relative w-full h-64 rounded-lg overflow-hidden mb-4 bg-muted">
                  <Image
                    src={opportunity.image_url}
                    alt={opportunity.title}
                    fill
                    className="object-cover transition-all duration-300 ease-in-out"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWESEyMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    loading="lazy"
                    priority={false}
                    unoptimized={true}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {opportunity.date}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  {opportunity.timeRange || "TBC"}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2" />
                  {opportunity.location}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  {opportunity.pay}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className={textStyles.subheading.small}>Brief</h3>
                {opportunity.description?.includes("**") ? (
                  <BriefRenderer text={opportunity.description} />
                ) : (
                  <p className={textStyles.body.regular}>
                    <LinkText text={opportunity.description} />
                  </p>
                )}
              </div>

              {opportunity.requirements && (
                <div className="space-y-2">
                  <h3 className={textStyles.subheading.small}>Requirements</h3>
                  <p className={textStyles.body.regular}>
                    <LinkText text={opportunity.requirements} />
                  </p>
                </div>
              )}

              {opportunity.additionalInfo ? (
                <div className="space-y-2">
                  <h3 className={textStyles.subheading.small}>
                    Additional information
                  </h3>
                  <p className={textStyles.body.regular}>
                    {opportunity.additionalInfo}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className={textStyles.body.regular}>
                    Total applicants
                  </span>
                </div>
                <span className={textStyles.subheading.small}>
                  {opportunity.applicants}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Quick actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(
                    `/admin/applications?opportunity=${opportunity.id}`
                  )
                }
              >
                <Users className="h-4 w-4 mr-2" />
                View applicants
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  router.push(`/admin/opportunities/${opportunity.id}/edit`)
                }
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit opportunity
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled={archiveLoading}
                onClick={() => handleArchiveToggle(!opportunity.is_archived)}
              >
                {archiveLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : opportunity.is_archived ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reopen in app
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4 mr-2" />
                    Mark as filled (archive)
                  </>
                )}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    disabled={archiveLoading}
                  >
                    <MoreVertical className="h-4 w-4 mr-2" />
                    More actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-card border-border"
                >
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={archiveLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete opportunity
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle
              className={`${textStyles.subheading.large} text-brand-white`}
            >
              Delete opportunity
            </DialogTitle>
            <DialogDescription className={textStyles.body.regular}>
              Are you sure you want to delete &quot;{opportunityToDelete?.title}
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
