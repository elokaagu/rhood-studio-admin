"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { createApplicationStatusNotification } from "@/lib/notifications";
import {
  completeGigAndRateDj,
  listPortalApplications,
  updatePortalApplicationStatus,
} from "@/lib/applications/service";
import type { ApplicationListItem } from "@/lib/applications/types";
import {
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function ApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const opportunityId = searchParams.get("opportunity");
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name_asc" | "name_desc" | "opportunity_asc" | "opportunity_desc">("newest");
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationListItem | null>(null);
  const [djRating, setDjRating] = useState<number>(0);
  const [djRatingComment, setDjRatingComment] = useState<string>("");

  // Fetch applications from database
  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const result = await listPortalApplications({ opportunityId });
      setApplications(result.applications);
      if (result.usedDemoFallback) {
        toast({
          title: "Database Setup Required",
          description:
            "Application data is unavailable in the current schema. Showing demo fallback data.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to load applications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load applications on component mount
  useEffect(() => {
    fetchApplications();
  }, [opportunityId, toast]);

  // Filter and sort applications
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    // Filter by opportunity if specified in URL (already filtered in query, but keep for consistency)
    if (opportunityId) {
      filtered = filtered.filter(
        (app) => app.opportunityId === opportunityId
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Filter by search term (name, opportunity, location)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((app) => {
        const applicantName = (app.applicant?.name || "").toLowerCase();
        const opportunity = (app.opportunity || "").toLowerCase();
        const location = (app.applicant?.location || "").toLowerCase();
        return (
          applicantName.includes(searchLower) ||
          opportunity.includes(searchLower) ||
          location.includes(searchLower)
        );
      });
    }

    // Sort applications
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime();
        case "oldest":
          return new Date(a.appliedAt || 0).getTime() - new Date(b.appliedAt || 0).getTime();
        case "name_asc":
          return (a.applicant?.name || "").localeCompare(b.applicant?.name || "");
        case "name_desc":
          return (b.applicant?.name || "").localeCompare(a.applicant?.name || "");
        case "opportunity_asc":
          return (a.opportunity || "").localeCompare(b.opportunity || "");
        case "opportunity_desc":
          return (b.opportunity || "").localeCompare(a.opportunity || "");
        default:
          return 0;
      }
    });

    return sorted;
  }, [applications, opportunityId, statusFilter, searchTerm, sortBy]);

  const stats = useMemo(
    () => ({
      pending: applications.filter((app) => app.status === "pending").length,
      approved: applications.filter((app) => app.status === "approved").length,
      rejected: applications.filter((app) => app.status === "rejected").length,
    }),
    [applications]
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-foreground" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-foreground" />;
      case "pending":
        return <Clock className="h-4 w-4 text-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-foreground" />;
    }
  };

  const handleStatusUpdate = async (
    application: ApplicationListItem,
    status: "approved" | "rejected"
  ) => {
    try {
      const updateResult = await updatePortalApplicationStatus({
        applicationId: application.id,
        applicationType: application.type,
        status,
      });
      if (!updateResult.ok) {
        toast({
          title: "Update Error",
          description: updateResult.message,
          variant: "destructive",
        });
        return;
      }

      if (application.userId && application.opportunity) {
        try {
          await createApplicationStatusNotification(
            application.userId,
            application.id,
            status,
            application.opportunity
          );
        } catch {
          // Keep status update success even if downstream effects fail.
        }
      }

      setApplications((prev: ApplicationListItem[]) =>
        prev.map((item: ApplicationListItem) =>
          item.id === application.id && item.type === application.type
            ? { ...item, status }
            : item
        )
      );
      toast({
        title: status === "approved" ? "Application Approved" : "Application Rejected",
        description:
          status === "approved"
            ? "The application has been approved and the user has been notified."
            : "The application has been rejected and the user has been notified.",
      });
    } catch (error) {
      console.error("Error updating application status:", error);
      toast({
        title: "Error",
        description: "Failed to update application status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Open rating dialog when marking gig complete
  const handleCompleteGigClick = (application: ApplicationListItem) => {
    setSelectedApplication(application);
    setDjRating(0);
    setDjRatingComment("");
    setRatingDialogOpen(true);
  };

  // Mark gig as completed and save rating
  const handleCompleteGig = async () => {
    if (!selectedApplication || djRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating (1-5 stars) before completing the gig.",
        variant: "destructive",
      });
      return;
    }

    try {
      const djUserId = selectedApplication.userId;
      if (!djUserId) {
        throw new Error("Could not find DJ user ID");
      }

      const completionResult = await completeGigAndRateDj({
        applicationId: selectedApplication.id,
        applicationType: selectedApplication.type,
        djUserId,
        stars: djRating,
        comment: djRatingComment,
      });

      if (!completionResult.ok) {
        toast({
          title: "Error",
          description: completionResult.message,
          variant: "destructive",
        });
        return;
      }

      if (!completionResult.ratingSaved) {
        toast({
          title: "Gig Completed",
          description:
            "Gig marked as completed, but rating could not be saved. Please try rating again.",
        });
      } else {
        // Award credits for rating (scales with star rating: 5=50, 4=25, 3=10, 2=5, 1=0)
        if (djRating >= 2) {
          try {
            const creditResponse = await fetch("/api/credits/award-rating-credits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                dj_id: djUserId,
                rating: djRating,
                reference_id: selectedApplication.id,
                reference_type: "application",
              }),
            });
            
            if (creditResponse.ok) {
              const creditData = await creditResponse.json();
              const creditsAwarded = creditData.credits_awarded || 0;
              if (creditsAwarded > 0) {
                // Credits were awarded successfully; no additional UI action needed here.
              }
            }
          } catch (creditError) {
            console.error("Error awarding rating credits:", creditError);
            // Don't fail if credits fail
          }
        }

        toast({
          title: "Gig Completed & Rated",
          description: `Gig marked as completed and DJ rated ${djRating} stars.`,
        });
      }

      setRatingDialogOpen(false);
      setSelectedApplication(null);
      setDjRating(0);
      setDjRatingComment("");
      setApplications((prev: ApplicationListItem[]) =>
        prev.map((item: ApplicationListItem) =>
          item.id === selectedApplication.id && item.type === selectedApplication.type
            ? { ...item, gig_completed: true }
            : item
        )
      );
    } catch (error) {
      console.error("Error marking gig as completed:", error);
      toast({
        title: "Error",
        description: "Failed to mark gig as completed. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-blur-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white text-lg sm:text-xl md:text-2xl">
            APPLICATIONS
          </h1>
          <p className={`${textStyles.body.regular} text-sm sm:text-base`}>
            Review and manage DJ applications
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.pending}
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.approved}
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.rejected}
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <XCircle className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Sort */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search */}
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by applicant name, opportunity, or location..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchTerm(e.target.value)
                  }
                  className="pl-10 bg-secondary border-border text-foreground h-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val: "all" | "pending" | "approved" | "rejected") =>
                setStatusFilter(val)
              }
            >
              <SelectTrigger className="w-full sm:w-32 bg-secondary border-border h-10">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(
                val:
                  | "newest"
                  | "oldest"
                  | "name_asc"
                  | "name_desc"
                  | "opportunity_asc"
                  | "opportunity_desc"
              ) => setSortBy(val)}
            >
              <SelectTrigger className="w-full sm:w-40 bg-secondary border-border h-10">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                <SelectItem value="opportunity_asc">Opportunity (A-Z)</SelectItem>
                <SelectItem value="opportunity_desc">Opportunity (Z-A)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="mx-auto w-full max-w-md space-y-3">
            <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
            <div className="h-20 w-full animate-pulse rounded-md bg-muted/70" />
            <div className="h-20 w-full animate-pulse rounded-md bg-muted/50" />
          </div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>No applications found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application: ApplicationListItem) => (
            <Card key={application.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className={`${textStyles.subheading.large} text-base sm:text-lg`}>
                      {application.opportunity}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground mt-2">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        {application.appliedDate}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="truncate">{application.applicant.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs sm:text-sm text-muted-foreground mt-2">
                      <div className="flex items-center">
                        <span className="text-foreground font-medium">
                          {application.applicant.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2">
                    <Badge
                      variant="outline"
                      className="border-border text-foreground bg-transparent text-xs w-full sm:w-auto justify-center sm:justify-start"
                    >
                      {getStatusIcon(application.status)}
                      <span className="ml-1">
                        {application.status.charAt(0).toUpperCase() +
                          application.status.slice(1)}
                      </span>
                    </Badge>

                    <div className="flex items-center gap-2 sm:space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-foreground text-xs sm:text-sm flex-1 sm:flex-initial"
                        onClick={() => router.push(`/admin/applications/${application.id}`)}
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span className="hidden sm:inline">View Details</span>
                        <span className="sm:hidden">View</span>
                      </Button>
                      {application.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-black transition-all duration-200 text-xs sm:text-sm flex-1 sm:flex-initial font-medium"
                            onClick={() => handleStatusUpdate(application, "approved")}
                            disabled={isLoading}
                          >
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                            <span className="hidden sm:inline">Approve</span>
                            <span className="sm:hidden">✓</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 text-xs sm:text-sm flex-1 sm:flex-initial"
                            onClick={() => handleStatusUpdate(application, "rejected")}
                          >
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden sm:inline">Reject</span>
                            <span className="sm:hidden">✗</span>
                          </Button>
                        </>
                      )}
                      {application.status === "approved" && !application.gig_completed && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-black transition-all duration-200 text-xs sm:text-sm flex-1 sm:flex-initial font-medium"
                          onClick={() => handleCompleteGigClick(application)}
                          disabled={isLoading}
                        >
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
                          <span className="hidden sm:inline">Mark Gig Done</span>
                          <span className="sm:hidden">✓ Gig</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
        )}
      </div>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={textStyles.subheading.large}>
              Mark Gig Complete & Rate DJ
            </DialogTitle>
            <DialogDescription className={textStyles.body.regular}>
              {selectedApplication && (
                <>
                  Rate{" "}
                  {selectedApplication.applicant?.djName ||
                    selectedApplication.applicant?.name ||
                    "the DJ"}{" "}
                  for their performance
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className={textStyles.body.regular}>
                Rating (Required) *
              </Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setDjRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= djRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {djRating > 0 && (
                <p className="text-sm text-muted-foreground">
                  {djRating} {djRating === 1 ? "star" : "stars"} selected
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating-comment" className={textStyles.body.regular}>
                Feedback (Optional)
              </Label>
              <Textarea
                id="rating-comment"
                placeholder="Share your feedback about the DJ's performance..."
                value={djRatingComment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDjRatingComment(e.target.value)
                }
                className="bg-secondary border-border text-foreground min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {djRatingComment.length}/500 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRatingDialogOpen(false);
                setSelectedApplication(null);
                setDjRating(0);
                setDjRatingComment("");
              }}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteGig}
              className="bg-brand-green text-brand-black hover:bg-brand-green/90"
              disabled={djRating === 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete & Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div className="mx-auto mt-8 w-full max-w-md space-y-3"><div className="h-5 w-40 animate-pulse rounded-md bg-muted" /><div className="h-20 w-full animate-pulse rounded-md bg-muted/70" /></div>}>
      <ApplicationsContent />
    </Suspense>
  );
}
