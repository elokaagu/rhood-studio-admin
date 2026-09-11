"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { LinkText } from "@/components/ui/link-text";
import { BriefRenderer } from "@/components/ui/brief-renderer";
import Image from "next/image";
import { GoogleMapsLink } from "@/components/google-maps-link";
import { parseGenres } from "@/lib/opportunities/genres";
import { isMappableLocation } from "@/lib/opportunities/location";
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
  Banknote,
  ImageOff,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { websiteDisplayLabel } from "@/lib/opportunities/website";

function MetaCell({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/50 px-3 py-3 min-w-0 overflow-hidden">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </p>
      <div className="mt-1.5 min-w-0 text-sm text-foreground break-words [overflow-wrap:anywhere]">
        {children}
      </div>
    </div>
  );
}

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
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-amber-400/70 text-amber-400 bg-amber-400/10 text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "active":
        return (
          <Badge
            variant="outline"
            className="border-brand-green text-brand-green bg-brand-green/10 text-xs"
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
  const genres = parseGenres(opportunity.genre);
  const feeLabel =
    !opportunity.pay || opportunity.pay === "N/A" ? "TBC" : opportunity.pay;

  return (
    <div className="space-y-6 animate-blur-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 mt-0.5"
            onClick={() => router.push("/admin/opportunities")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Opportunity
            </p>
            <h1 className={`${textStyles.headline.section} text-left text-lg sm:text-xl md:text-2xl mt-0.5`}>
              {opportunity.title}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/admin/opportunities/${opportunityId}/edit`)
            }
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 hover:text-red-400"
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
          <Card className="bg-card border-border overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,280px)_1fr]">
              <div className="relative aspect-square bg-muted">
                {opportunity.image_url ? (
                  <Image
                    src={opportunity.image_url}
                    alt={opportunity.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 280px"
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWESEyMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    unoptimized={true}
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <ImageOff className="h-8 w-8 mb-2" />
                    <p className="text-xs">No artwork</p>
                  </div>
                )}
              </div>

              <div className="p-5 sm:p-6 flex flex-col justify-between gap-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(badgeStatus)}
                    {genres.map((genre) => (
                      <Badge
                        key={genre}
                        variant="outline"
                        className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                  <h2 className={`${textStyles.subheading.large} mt-3 text-left`}>
                    {opportunity.title}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <MetaCell icon={Calendar} label="Date">
                    {opportunity.date}
                  </MetaCell>
                  <MetaCell icon={Clock} label="Time">
                    {opportunity.timeRange || "TBC"}
                  </MetaCell>
                  <MetaCell icon={MapPin} label="Location">
                    {isMappableLocation(opportunity.location) ? (
                      <GoogleMapsLink
                        address={opportunity.location}
                        className="text-sm text-foreground hover:text-brand-green"
                      />
                    ) : (
                      opportunity.location?.trim() || "—"
                    )}
                  </MetaCell>
                  <MetaCell icon={Banknote} label="Compensation">
                    <span
                      className={
                        feeLabel === "TBC" ? "text-muted-foreground" : undefined
                      }
                    >
                      {feeLabel}
                    </span>
                  </MetaCell>
                  {opportunity.website ? (
                    <MetaCell icon={Globe} label="Website">
                      <a
                        href={opportunity.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-foreground hover:text-brand-green"
                      >
                        {websiteDisplayLabel(opportunity.website)}
                      </a>
                    </MetaCell>
                  ) : null}
                </div>
              </div>
            </div>

            <Separator />

            <CardContent className="p-5 sm:p-6 space-y-6">
              <section className="space-y-2">
                <h3 className={`${textStyles.subheading.small} text-muted-foreground uppercase tracking-wide text-xs`}>
                  Brief
                </h3>
                {opportunity.description?.includes("**") ? (
                  <BriefRenderer text={opportunity.description} />
                ) : (
                  <p className={`${textStyles.body.regular} leading-relaxed`}>
                    <LinkText text={opportunity.description} />
                  </p>
                )}
              </section>

              {opportunity.requirements && (
                <section className="space-y-2">
                  <h3 className={`${textStyles.subheading.small} text-muted-foreground uppercase tracking-wide text-xs`}>
                    Requirements
                  </h3>
                  <p className={textStyles.body.regular}>
                    <LinkText text={opportunity.requirements} />
                  </p>
                </section>
              )}

              {opportunity.additionalInfo ? (
                <section className="space-y-2">
                  <h3 className={`${textStyles.subheading.small} text-muted-foreground uppercase tracking-wide text-xs`}>
                    Additional information
                  </h3>
                  <p className={textStyles.body.regular}>
                    {opportunity.additionalInfo}
                  </p>
                </section>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className={`${textStyles.subheading.small} uppercase tracking-wide text-xs text-muted-foreground`}>
                Applicants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-3">
                <p className={`${textStyles.headline.section} text-left leading-none`}>
                  {opportunity.applicants}
                </p>
                <Users className="h-5 w-5 text-brand-green mb-1" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {opportunity.applicants === 1 ? "application" : "applications"} received
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className={`${textStyles.subheading.small} uppercase tracking-wide text-xs text-muted-foreground`}>
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start bg-brand-green text-brand-black hover:bg-brand-green/90"
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
