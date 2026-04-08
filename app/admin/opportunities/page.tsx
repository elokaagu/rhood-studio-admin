"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatTimeRange } from "@/lib/date-utils";
import Image from "next/image";
import {
  fetchAdminOpportunitiesList,
  paySortValue,
  type OpportunityListItem,
} from "@/lib/admin/opportunities/opportunity-list";
import {
  deleteOpportunityById,
  updateOpportunityArchiveState,
} from "@/lib/admin/opportunities/opportunity-detail";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  MoreVertical,
  Archive,
  RotateCcw,
  Rocket,
  Coins,
} from "lucide-react";

type ListSortKey =
  | "newest"
  | "oldest"
  | "pay_high"
  | "pay_low"
  | "applicants_high"
  | "applicants_low";

export default function OpportunitiesPage() {
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<OpportunityListItem[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [boostingOpportunityId, setBoostingOpportunityId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "completed" | "closed" | "archived">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "pay_high" | "pay_low" | "applicants_high" | "applicants_low">("newest");

  const loadOpportunitiesList = useCallback(async (showLoading = true) => {
    setFetchError(null);
    if (showLoading) setIsLoading(true);
    const result = await fetchAdminOpportunitiesList();
    if (!result.ok) {
      setFetchError(result.message);
      setOpportunities([]);
      if (showLoading) setIsLoading(false);
      return;
    }
    setOpportunities(result.items);
    setUserCredits(result.userCredits);
    setUserRole(result.userRole);
    if (showLoading) setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadOpportunitiesList(true);
  }, [loadOpportunitiesList]);

  const handleDelete = async (
    opportunityId: string,
    opportunityTitle: string
  ) => {
    setOpportunityToDelete({ id: opportunityId, title: opportunityTitle });
    setDeleteModalOpen(true);
  };

  const handleBoost = async (opportunityId: string, opportunityTitle: string) => {
    try {
      setBoostingOpportunityId(opportunityId);
      
      const response = await fetch("/api/credits/boost-opportunity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          opportunity_id: opportunityId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to boost opportunity");
      }

      toast({
        title: "Successfully Boosted!",
        description: `${opportunityTitle} has been boosted to the top of the list for 24 hours.`,
      });

      await loadOpportunitiesList(false);
    } catch (error: any) {
      console.error("Error boosting opportunity:", error);
      toast({
        title: "Boost Failed",
        description: error.message || "Failed to boost opportunity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBoostingOpportunityId(null);
    }
  };

  const confirmDelete = async () => {
    if (!opportunityToDelete) return;

    try {
      const result = await deleteOpportunityById(opportunityToDelete.id);
      if (!result.ok) {
        throw new Error(result.message);
      }

      setOpportunities((prevOpportunities: OpportunityListItem[]) =>
        prevOpportunities.filter((opp) => opp.id !== opportunityToDelete.id)
      );

      toast({
        title: "Opportunity Deleted",
        description: `"${opportunityToDelete.title}" has been deleted successfully.`,
      });
    } catch (error) {
      console.error("Error deleting opportunity:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete opportunity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteModalOpen(false);
      setOpportunityToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setOpportunityToDelete(null);
  };

  const toggleArchive = async (
    opportunityId: string,
    opportunityTitle: string,
    shouldArchive: boolean
  ) => {
    setActionLoadingId(opportunityId);

    try {
      const result = await updateOpportunityArchiveState(
        opportunityId,
        shouldArchive
      );
      if (!result.ok) {
        throw new Error(result.message);
      }

      await loadOpportunitiesList(false);

      toast({
        title: shouldArchive ? "Opportunity archived" : "Opportunity reopened",
        description: shouldArchive
          ? `"${opportunityTitle}" is no longer visible in the app.`
          : `"${opportunityTitle}" has been restored for talent in the app.`,
      });
    } catch (error) {
      console.error("Error updating archive status:", error);
      toast({
        title: "Update failed",
        description: "Unable to update opportunity visibility. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
    }
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

  const filteredOpportunities = useMemo(() => {
    let list = opportunities.filter((opp: OpportunityListItem) =>
      showArchived ? true : !opp.is_archived
    );

    if (statusFilter !== "all") {
      list = list.filter((opp: OpportunityListItem) =>
        statusFilter === "archived"
          ? opp.is_archived
          : !opp.is_archived && opp.status === statusFilter
      );
    }

    const sortFns: Record<
      ListSortKey,
      (a: OpportunityListItem, b: OpportunityListItem) => number
    > = {
      newest: (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime(),
      oldest: (a, b) =>
        new Date(a.created_at || 0).getTime() -
        new Date(b.created_at || 0).getTime(),
      pay_high: (a, b) => paySortValue(b) - paySortValue(a),
      pay_low: (a, b) => paySortValue(a) - paySortValue(b),
      applicants_high: (a, b) => b.applicants - a.applicants,
      applicants_low: (a, b) => a.applicants - b.applicants,
    };

    return [...list].sort(sortFns[sortBy as ListSortKey]);
  }, [opportunities, showArchived, statusFilter, sortBy]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-blur-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white text-lg sm:text-xl md:text-2xl">
            OPPORTUNITIES
          </h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base`}>
            Manage all DJ opportunities and gigs
          </p>
        </div>
        <Button
          asChild
          className="bg-brand-green hover:bg-brand-green/90 text-brand-black w-full sm:w-auto"
        >
          <Link href="/admin/create-opportunity">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Create Opportunity</span>
            <span className="sm:hidden">Create</span>
          </Link>
        </Button>
      </div>

      {fetchError && !isLoading && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-destructive">{fetchError}</p>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => void loadOpportunitiesList(true)}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Sort by</p>
              <Select value={sortBy} onValueChange={(val) => setSortBy(val as typeof sortBy)}>
                <SelectTrigger className="w-44 bg-secondary border-border">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="pay_high">Pay: High to Low</SelectItem>
                  <SelectItem value="pay_low">Pay: Low to High</SelectItem>
                  <SelectItem value="applicants_high">Applicants: High to Low</SelectItem>
                  <SelectItem value="applicants_low">Applicants: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as typeof statusFilter)}>
                <SelectTrigger className="w-40 bg-secondary border-border">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived((prev) => !prev)}
            className="w-full sm:w-auto"
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    opportunities.filter(
                      (opp: OpportunityListItem) =>
                        opp.status === "active" && !opp.is_archived
                    ).length
                  }
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Opportunities
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {opportunities.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Closed</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    opportunities.filter(
                      (opp: OpportunityListItem) =>
                        !opp.is_archived &&
                        (opp.status === "completed" || opp.status === "closed")
                    ).length
                  }
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Archived</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    opportunities.filter((opp: OpportunityListItem) => opp.is_archived)
                      .length
                  }
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Archive className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
          </div>
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>
              {fetchError && opportunities.length === 0
                ? "Could not load opportunities. Use Retry above or refresh the page."
                : "No opportunities found. Create your first opportunity!"}
            </p>
          </div>
        ) : (
          filteredOpportunities.map((opportunity: OpportunityListItem) => (
            <Card
              key={opportunity.id}
              className={`bg-card border-border ${
                opportunity.is_archived ? "opacity-75" : ""
              }`}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  {/* Image Section */}
                  {opportunity.image_url && (
                    <div className="flex-shrink-0 w-full sm:w-auto">
                      <div className="relative w-full sm:w-32 h-48 sm:h-32 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={opportunity.image_url}
                          alt={opportunity.title}
                          fill
                          className="object-cover transition-all duration-300 ease-in-out"
                          sizes="(max-width: 640px) 100vw, 128px"
                          placeholder="blur"
                          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWESEyMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                          loading="lazy"
                          unoptimized={true}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex-1 w-full min-w-0">
                    <h3 className={`${textStyles.subheading.large} mb-2 text-base sm:text-lg`}>
                      {opportunity.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="truncate">
                          {opportunity.event_date
                            ? formatDate(opportunity.event_date)
                            : "—"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="truncate">
                          {formatTimeRange(
                            opportunity.event_date,
                            opportunity.event_end_time
                          )}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="truncate">{opportunity.location}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="truncate">
                          {opportunity.payment != null
                            ? `£${opportunity.payment}`
                            : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        {opportunity.applicants || 0} applicants
                      </div>
                      {opportunity.hasBoost && (
                        <Badge
                          variant="outline"
                          className="border-brand-green text-brand-green bg-transparent text-xs"
                        >
                          <Rocket className="h-3 w-3 mr-1" />
                          Boosted
                        </Badge>
                      )}
                    </div>

                    {/* Mobile: Action buttons below content */}
                    <div className="flex flex-wrap items-center gap-2 sm:hidden mt-3">
                      {getStatusBadge(opportunity.status)}
                      {opportunity.genre && (
                        <Badge
                          variant="outline"
                          className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase"
                        >
                          {opportunity.genre}
                        </Badge>
                      )}
                      {/* Boost button for DJs */}
                      {userRole !== "brand" && userRole !== "admin" && !opportunity.userBoost && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-brand-green border-brand-green hover:bg-brand-green hover:text-brand-black text-xs"
                          onClick={() => handleBoost(opportunity.id, opportunity.title)}
                          disabled={boostingOpportunityId === opportunity.id || userCredits < 100}
                          title={userCredits < 100 ? "You need 100 credits to boost" : "Boost to top (100 credits)"}
                        >
                          {boostingOpportunityId === opportunity.id ? (
                            <>
                              <Clock className="h-3 w-3 mr-1 animate-spin" />
                              Boosting...
                            </>
                          ) : (
                            <>
                              <Rocket className="h-3 w-3 mr-1" />
                              Boost
                            </>
                          )}
                        </Button>
                      )}
                      {opportunity.userBoost && (
                        <Badge
                          variant="outline"
                          className="border-brand-green text-brand-green bg-brand-green/10 text-xs"
                        >
                          <Rocket className="h-3 w-3 mr-1" />
                          Your Boost Active
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-foreground text-xs"
                        asChild
                      >
                        <Link href={`/admin/opportunities/${opportunity.id}`}>
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            disabled={actionLoadingId === opportunity.id}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-card border-border"
                        >
                          <DropdownMenuItem
                            onClick={() =>
                              toggleArchive(
                                opportunity.id,
                                opportunity.title,
                                !opportunity.is_archived
                              )
                            }
                            disabled={actionLoadingId === opportunity.id}
                          >
                            {opportunity.is_archived ? (
                              <RotateCcw className="h-4 w-4 mr-2" />
                            ) : (
                              <Archive className="h-4 w-4 mr-2" />
                            )}
                            {opportunity.is_archived ? "Reopen" : "Archive"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDelete(opportunity.id, opportunity.title)
                            }
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={actionLoadingId === opportunity.id}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Desktop: Action buttons on the right */}
                  <div className="hidden sm:flex items-center space-x-2">
                    {getStatusBadge(opportunity.status)}
                    {opportunity.genre && (
                      <Badge
                        variant="outline"
                        className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase"
                      >
                        {opportunity.genre}
                      </Badge>
                    )}
                    {/* Boost button for DJs - Desktop */}
                    {userRole !== "brand" && userRole !== "admin" && !opportunity.userBoost && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-brand-green border-brand-green hover:bg-brand-green hover:text-brand-black"
                        onClick={() => handleBoost(opportunity.id, opportunity.title)}
                        disabled={boostingOpportunityId === opportunity.id || userCredits < 100}
                        title={userCredits < 100 ? "You need 100 credits to boost" : "Boost to top (100 credits)"}
                      >
                        {boostingOpportunityId === opportunity.id ? (
                          <>
                            <Clock className="h-4 w-4 mr-1 animate-spin" />
                            Boosting...
                          </>
                        ) : (
                          <>
                            <Rocket className="h-4 w-4 mr-1" />
                            Boost
                          </>
                        )}
                      </Button>
                    )}
                    {opportunity.userBoost && (
                      <Badge
                        variant="outline"
                        className="border-brand-green text-brand-green bg-brand-green/10"
                      >
                        <Rocket className="h-4 w-4 mr-1" />
                        Your Boost Active
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-foreground"
                      asChild
                    >
                      <Link href={`/admin/opportunities/${opportunity.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={actionLoadingId === opportunity.id}
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
                            toggleArchive(
                              opportunity.id,
                              opportunity.title,
                              !opportunity.is_archived
                            )
                          }
                          disabled={actionLoadingId === opportunity.id}
                        >
                          {opportunity.is_archived ? (
                            <RotateCcw className="h-4 w-4 mr-2" />
                          ) : (
                            <Archive className="h-4 w-4 mr-2" />
                          )}
                          {opportunity.is_archived ? "Reopen" : "Archive"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleDelete(opportunity.id, opportunity.title)
                          }
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          disabled={actionLoadingId === opportunity.id}
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
              Delete Opportunity
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
