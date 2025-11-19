"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatTimeRange } from "@/lib/date-utils";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserProfile, getCurrentUserId } from "@/lib/auth-utils";
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
  Plus,
  Calendar,
  MapPin,
  Users,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  MoreVertical,
  Archive,
  RotateCcw,
} from "lucide-react";

export default function OpportunitiesPage() {
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch opportunities from database
  const fetchOpportunities = async () => {
    try {
      const userProfile = await getCurrentUserProfile();
      const userId = await getCurrentUserId();

      // Build query based on user role
      let query = supabase.from("opportunities").select("*");

      // Brands can only see their own opportunities
      if (userProfile?.role === "brand" && userId) {
        query = query.eq("organizer_id", userId);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) {
        throw error;
      }

      // Fetch applicants count for each opportunity
      if (data && data.length > 0) {
        const opportunitiesWithApplicants = await Promise.all(
          data.map(async (opportunity) => {
            try {
              const { count, error: countError } = await supabase
                .from("applications")
                .select("*", { count: "exact", head: true })
                .eq("opportunity_id", opportunity.id);

              return {
                ...opportunity,
                applicants: countError ? 0 : count || 0,
              };
            } catch (err) {
              console.warn(
                `Could not fetch applicants count for opportunity ${opportunity.id}:`,
                err
              );
              return {
                ...opportunity,
                applicants: 0,
              };
            }
          })
        );

        const now = new Date();
        const expiredIds: string[] = [];

        let normalized = opportunitiesWithApplicants.map((opportunity) => {
          const normalizedId =
            typeof opportunity.id === "number"
              ? String(opportunity.id)
              : typeof opportunity.id === "string"
              ? opportunity.id
              : String(opportunity.id ?? "");
          const endDate = opportunity.event_end_time
            ? new Date(opportunity.event_end_time)
            : opportunity.event_date
            ? new Date(opportunity.event_date)
            : null;
          const isArchived = opportunity.is_archived ?? false;
          const rawStatus = (opportunity as { status?: string | null }).status;
          const derivedStatus = rawStatus
            ? rawStatus
            : opportunity.is_active
            ? "active"
            : "draft";

          if (
            endDate &&
            !isNaN(endDate.getTime()) &&
            endDate.getTime() < now.getTime() &&
            !isArchived
          ) {
            expiredIds.push(normalizedId);
          }

          return {
            ...opportunity,
            id: normalizedId,
            is_archived: isArchived,
            status: isArchived ? "archived" : derivedStatus,
          };
        });

        if (expiredIds.length > 0) {
          const { error: archiveError } = await supabase
            .from("opportunities")
            .update({ is_archived: true, is_active: false })
            .in("id", expiredIds);

          if (archiveError) {
            console.error(
              "Failed to auto-archive expired opportunities:",
              archiveError
            );
          } else {
            normalized = normalized.map((opportunity) =>
              expiredIds.includes(opportunity.id)
                ? {
                    ...opportunity,
                    is_archived: true,
                    is_active: false,
                    status: "archived",
                  }
                : opportunity
            );
            toast({
              title: "Opportunities archived",
              description: `${expiredIds.length} expired opportunity${
                expiredIds.length === 1 ? "" : "ies"
              } moved out of the app automatically.`,
            });
          }
        }

        setOpportunities(normalized);
      } else {
        setOpportunities([]);
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
      toast({
        title: "Error",
        description: "Failed to load opportunities. Using demo data.",
        variant: "destructive",
      });
      // Fallback to demo data
      setOpportunities([
        {
          id: "1",
          title: "Underground Warehouse Rave",
          location: "East London",
          date: "2024-08-15",
          event_end_time: null,
          pay: "£300",
          applicants: 12,
          status: "active",
          genre: "Techno",
          description:
            "High-energy underground techno event in a converted warehouse space.",
          is_archived: false,
        },
        {
          id: "2",
          title: "Rooftop Summer Sessions",
          location: "Shoreditch",
          date: "2024-08-20",
          event_end_time: null,
          pay: "£450",
          applicants: 8,
          status: "active",
          genre: "House",
          description: "Sunset house music sessions with panoramic city views.",
          is_archived: false,
        },
        {
          id: "3",
          title: "Club Residency Audition",
          location: "Camden",
          date: "2024-08-25",
          event_end_time: null,
          pay: "£200 + Residency",
          applicants: 15,
          status: "completed",
          genre: "Drum & Bass",
          selected: "Alex Thompson",
          description: "Weekly residency opportunity at premier London club.",
          is_archived: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load opportunities on component mount
  useEffect(() => {
    fetchOpportunities();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (
    opportunityId: string,
    opportunityTitle: string
  ) => {
    setOpportunityToDelete({ id: opportunityId, title: opportunityTitle });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!opportunityToDelete) return;

    try {
      // Delete from Supabase database
      const { error } = await supabase
        .from("opportunities")
        .delete()
        .eq("id", opportunityToDelete.id);

      if (error) {
        throw error;
      }

      // Remove from local state
      setOpportunities((prevOpportunities) =>
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
      const currentOpportunity = opportunities.find(
        (opp) => opp.id === opportunityId
      );
      const nextIsActive = shouldArchive
        ? false
        : currentOpportunity?.status === "active";

      const { error } = await supabase
        .from("opportunities")
        .update({
          is_archived: shouldArchive,
          is_active: nextIsActive,
        })
        .eq("id", opportunityId);

      if (error) {
        throw error;
      }

      setOpportunities((previous) =>
        previous.map((opp) =>
          opp.id === opportunityId
            ? {
                ...opp,
                is_archived: shouldArchive,
                is_active: nextIsActive,
                status: shouldArchive
                  ? "archived"
                  : nextIsActive
                  ? "active"
                  : opp.status === "archived"
                  ? "draft"
                  : opp.status,
              }
            : opp
        )
      );

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

  return (
    <div className="space-y-4 sm:space-y-6">
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
          className="bg-brand-green hover:bg-brand-green/90 text-brand-black w-full sm:w-auto"
          onClick={() => (window.location.href = "/admin/create-opportunity")}
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Create Opportunity</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>

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
                      (opp) => opp.status === "active" && !opp.is_archived
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
                      (opp) =>
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
                  {opportunities.filter((opp) => opp.is_archived).length}
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
            <p className={textStyles.body.regular}>Loading opportunities...</p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>
              No opportunities found. Create your first opportunity!
            </p>
          </div>
        ) : (
          opportunities.map((opportunity) => (
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
                            : opportunity.date}
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
                          {opportunity.payment
                            ? `£${opportunity.payment}`
                            : opportunity.pay}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        {opportunity.applicants || 0} applicants
                      </div>
                      {opportunity.selected && (
                        <div className="flex items-center">
                          <span className="text-brand-green">Selected: </span>
                          <span className="text-foreground truncate">
                            {opportunity.selected}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Mobile: Action buttons below content */}
                    <div className="flex flex-wrap items-center gap-2 sm:hidden mt-3">
                      {getStatusBadge(
                        opportunity.is_archived
                          ? "archived"
                          : opportunity.is_active
                          ? "active"
                          : opportunity.status
                      )}
                      {opportunity.genre && (
                        <Badge
                          variant="outline"
                          className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase"
                        >
                          {opportunity.genre}
                        </Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-foreground text-xs"
                        onClick={() =>
                          (window.location.href = `/admin/opportunities/${opportunity.id}`)
                        }
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
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
                    {getStatusBadge(
                      opportunity.is_archived
                        ? "archived"
                        : opportunity.is_active
                        ? "active"
                        : opportunity.status
                    )}
                    {opportunity.genre && (
                      <Badge
                        variant="outline"
                        className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase"
                      >
                        {opportunity.genre}
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-foreground"
                      onClick={() =>
                        (window.location.href = `/admin/opportunities/${opportunity.id}`)
                      }
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
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
