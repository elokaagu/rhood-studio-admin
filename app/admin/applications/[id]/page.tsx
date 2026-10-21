"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { textStyles } from "@/lib/typography";
import { getMixSharePath } from "@/lib/mixes/share-url";
import { useToast } from "@/hooks/use-toast";
import {
  createApplicationStatusNotification,
  notifyApplicantOfApprovedApplication,
} from "@/lib/notifications";
import {
  Calendar,
  MapPin,
  Music,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Mail,
  Play,
  Star,
  MessageSquare,
  Instagram,
  Headphones,
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
import {
  getApplicationDetails,
  submitBrandRating,
  updateApplicationStatus,
} from "@/lib/applications/service";
import { ApplicantConversationDialog } from "@/components/admin/applications/ApplicantConversationDialog";
import type {
  ApplicationDetails,
  BrandRating,
  UserMix,
} from "@/lib/applications/types";

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = String(params.id);
  const { toast } = useToast();
  const [application, setApplication] = useState<ApplicationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userMix, setUserMix] = useState<UserMix | null>(null);
  const [brandRatingDialogOpen, setBrandRatingDialogOpen] = useState(false);
  const [brandRating, setBrandRating] = useState<number>(0);
  const [brandRatingComment, setBrandRatingComment] = useState<string>("");
  const [existingBrandRating, setExistingBrandRating] = useState<BrandRating | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [conversationOpen, setConversationOpen] = useState(false);

  const fetchApplication = async () => {
    setIsLoading(true);
    try {
      const result = await getApplicationDetails(applicationId);
      setApplication(result.application);
      setUserMix(result.userMix);
      setCurrentUserRole(result.currentUserRole);
      setExistingBrandRating(result.existingBrandRating);

      if (result.usedDemoFallback) {
        toast({
          title: "Database Setup Required",
          description:
            "Application data is unavailable in the current schema. Showing demo fallback data.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching application:", error);
      toast({
        title: "Database Error",
        description: "Failed to load application.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (
    nextStatus: "approved" | "rejected"
  ) => {
    if (!application) return;
    try {
      setIsUpdatingStatus(true);
      const result = await updateApplicationStatus(applicationId, nextStatus);
      if (!result.ok) {
        toast({
          title: "Update Error",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      if (application.userId && application.opportunity) {
        try {
          await createApplicationStatusNotification(
            application.userId,
            applicationId,
            nextStatus,
            application.opportunity
          );
        } catch {
          // Keep status update success even if downstream effects fail.
        }
      }

      if (nextStatus === "approved" && !result.emailsHandled) {
        try {
          await notifyApplicantOfApprovedApplication({
            email: application.applicant.email,
            applicantName: application.applicant.name,
            opportunityTitle: application.opportunity,
            userId: application.userId,
            applicationId: application.id,
            opportunityId: application.opportunityId,
            organizerId: application.organizerId,
          });
        } catch {
          // Email is best-effort.
        }
      }

      setApplication((prev: ApplicationDetails | null) =>
        prev ? { ...prev, status: nextStatus } : prev
      );
      toast({
        title: nextStatus === "approved" ? "Application Approved" : "Application Rejected",
        description:
          nextStatus === "approved"
            ? "The DJ has been approved, emailed, and introduced to the brand on a shared thread."
            : "The application has been rejected and the user has been notified.",
      });
    } catch (error) {
      console.error(`Error updating application to ${nextStatus}:`, error);
      toast({
        title: "Error",
        description: "Failed to update application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Load application on component mount
  useEffect(() => {
    fetchApplication();
  }, [applicationId, toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge
            variant="outline"
            className="border-green-400 text-green-400 bg-transparent text-xs"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="border-red-400 text-red-400 bg-transparent text-xs"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="border-yellow-400 text-yellow-400 bg-transparent text-xs"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
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

  const handleSubmitBrandRating = async () => {
    if (!application || brandRating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating (1-5 stars) before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!application.organizerId) {
      toast({
        title: "Error",
        description: "Missing organizer information for this application.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmittingRating(true);
      const result = await submitBrandRating({
        applicationId: application.id,
        organizerId: application.organizerId,
        stars: brandRating,
        comment: brandRatingComment,
      });

      if (!result.ok) {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      setExistingBrandRating({
        stars: brandRating,
        comment: brandRatingComment.trim() || null,
      });
      setBrandRatingDialogOpen(false);
      setBrandRating(0);
      setBrandRatingComment("");
      toast({
        title: "Rating Submitted",
        description: `Thank you for rating your experience ${brandRating} stars!`,
      });
    } catch (error) {
      console.error("Error submitting brand rating:", error);
      toast({
        title: "Error",
        description: "Failed to submit rating. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingRating(false);
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

  if (!application) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className={textStyles.headline.section}>APPLICATION NOT FOUND</h1>
          <p className={textStyles.body.regular}>
            The application you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button
            onClick={() => router.push("/admin/applications")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-blur-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3 sm:items-center sm:gap-4 min-w-0">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 sm:w-auto sm:px-4"
            onClick={() => router.push("/admin/applications")}
            aria-label="Back to applications"
          >
            <ArrowLeft className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className={textStyles.headline.page}>
                APPLICATION DETAILS
              </h1>
              <span className="md:hidden">{getStatusBadge(application.status)}</span>
            </div>
            <p className={`${textStyles.body.regular} text-sm sm:text-base`}>
              Review application information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-flex">{getStatusBadge(application.status)}</span>
          {application.status === "pending" && (
            <>
              <Button
                variant="outline"
                className="flex-1 md:flex-none border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-black transition-colors"
                onClick={() => handleStatusUpdate("approved")}
                disabled={isUpdatingStatus}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                className="flex-1 md:flex-none text-red-600 hover:text-red-700"
                onClick={() => handleStatusUpdate("rejected")}
                disabled={isUpdatingStatus}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant */}
          <Card className="bg-card border-border overflow-hidden">
            <div className="h-1 bg-brand-green" />
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="flex items-start gap-4 min-w-0">
                <Avatar className="h-20 w-20 shrink-0 ring-2 ring-brand-green/30">
                  <AvatarImage
                    src={application.applicant.avatar}
                    alt={application.applicant.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-brand-green text-brand-black font-bold text-xl">
                    {application.applicant.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-ts-block text-xl sm:text-2xl uppercase text-foreground break-words">
                      {application.applicant.name}
                    </h3>
                    {application.djProfileRating != null &&
                      application.djProfileRating > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
                          <Star className="h-3 w-3 fill-yellow-400" />
                          {application.djProfileRating.toFixed(1)}
                        </span>
                      )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 min-w-0">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{application.applicant.location}</span>
                    </span>
                    <a
                      href={`mailto:${application.applicant.email}`}
                      className="inline-flex items-center gap-1.5 min-w-0 hover:text-brand-green transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{application.applicant.email}</span>
                    </a>
                  </div>
                </div>
              </div>

              {application.applicant.bio && (
                <p className={`${textStyles.body.regular} text-muted-foreground`}>
                  {application.applicant.bio}
                </p>
              )}

              {application.applicant.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {application.applicant.genres.map((genre: string) => (
                    <Badge
                      key={genre}
                      variant="outline"
                      className="border-brand-green/50 text-brand-green bg-brand-green/5 text-xs font-bold uppercase"
                    >
                      <Music className="h-3 w-3 mr-1" />
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}

              {(application.applicant.instagram ||
                application.applicant.soundcloud) && (
                <div className="flex flex-wrap gap-2">
                  {application.applicant.instagram && (
                    <a
                      href={application.applicant.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2.5 py-1.5 text-xs text-brand-green hover:border-brand-green/40 hover:bg-brand-green/10 transition-colors"
                    >
                      <Instagram className="h-3.5 w-3.5" />
                      Instagram
                    </a>
                  )}
                  {application.applicant.soundcloud && (
                    <a
                      href={application.applicant.soundcloud}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2.5 py-1.5 text-xs text-brand-green hover:border-brand-green/40 hover:bg-brand-green/10 transition-colors"
                    >
                      <Music className="h-3.5 w-3.5" />
                      SoundCloud
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Opportunity + Audio ID */}
          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
                  Opportunity
                </p>
                <h3 className="font-ts-block text-xl sm:text-2xl uppercase text-foreground">
                  {application.opportunity}
                </h3>
              </div>

              {userMix ? (
                <button
                  type="button"
                  onClick={() => {
                    if (userMix?.id) {
                      window.open(getMixSharePath(userMix.id), "_blank");
                      return;
                    }
                    toast({
                      title: "Mix URL Missing",
                      description: "This mix doesn't have a shareable ID.",
                      variant: "destructive",
                    });
                  }}
                  className="group relative w-full overflow-hidden rounded-lg border border-brand-green/40 bg-gradient-to-br from-brand-green/15 via-secondary to-black text-left transition-all hover:border-brand-green hover:shadow-[0_0_0_1px_rgba(180,255,57,0.25)]"
                >
                  <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-green/40 via-transparent to-transparent" />
                  <div className="relative flex items-center gap-4 p-4 sm:p-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-green text-brand-black shadow-lg group-hover:scale-105 transition-transform">
                      <Play className="h-6 w-6 fill-current ml-0.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-brand-green mb-0.5">
                        <Headphones className="h-3.5 w-3.5" />
                        <span className="text-[11px] uppercase tracking-[0.16em] font-semibold">
                          Audio ID
                        </span>
                      </div>
                      <p className="text-base sm:text-lg font-semibold text-foreground">
                        Listen to mix
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        Opens {application.applicant.name}&apos;s Audio ID
                      </p>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="rounded-lg border border-border bg-secondary/40 p-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Headphones className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">No Audio ID yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This DJ hasn&apos;t uploaded a mix.
                    </p>
                  </div>
                </div>
              )}

              {application.coverLetter &&
                application.coverLetter !== "No cover letter provided" && (
                  <div className="pt-1 border-t border-border">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2 mt-4">
                      Cover letter
                    </p>
                    <p className={textStyles.body.regular}>{application.coverLetter}</p>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border overflow-hidden">
            <div className="h-1 bg-brand-green/60" />
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  Status
                </p>
                <div className="flex items-center justify-between gap-3">
                  {getStatusBadge(application.status)}
                  <span className="text-xs text-muted-foreground text-right">
                    Applied {application.appliedDate}
                  </span>
                </div>
              </div>

              {(application.applicationDjRating ||
                (application.djProfileRating != null &&
                  application.djProfileRating > 0)) && (
                <div className="pt-3 border-t border-border space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    DJ rating
                  </p>
                  {application.djProfileRating != null &&
                    application.djProfileRating > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= Math.round(application.djProfileRating!)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/40"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {application.djProfileRating.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">overall</span>
                      </div>
                    )}
                  {application.applicationDjRating && (
                    <div className="rounded-md border border-border bg-secondary/40 p-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                star <= application.applicationDjRating!.stars
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/40"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">this gig</span>
                      </div>
                      {application.applicationDjRating.comment && (
                        <p className="text-sm text-muted-foreground italic">
                          &quot;{application.applicationDjRating.comment}&quot;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentUserRole === "dj" && application.gigCompleted && (
                <div className="pt-3 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Gig</span>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                  {existingBrandRating ? (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Your brand rating</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= existingBrandRating.stars
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground/40"
                            }`}
                          />
                        ))}
                      </div>
                      {existingBrandRating.comment && (
                        <p className="text-sm text-muted-foreground italic">
                          &quot;{existingBrandRating.comment}&quot;
                        </p>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-black"
                      onClick={() => setBrandRatingDialogOpen(true)}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Rate Brand Experience
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border overflow-hidden">
            <CardContent className="p-3 space-y-1.5">
              <Button
                variant="ghost"
                className="w-full justify-start h-11 px-3 hover:bg-brand-green/10 hover:text-brand-green"
                onClick={() =>
                  router.push(`/admin/opportunities/${application.opportunityId}`)
                }
              >
                <Calendar className="h-4 w-4 mr-3 text-brand-green" />
                View Opportunity
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-11 px-3 hover:bg-brand-green/10 hover:text-brand-green"
                onClick={() => setConversationOpen(true)}
                disabled={!application.userId}
              >
                <MessageSquare className="h-4 w-4 mr-3 text-brand-green" />
                Message DJ
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-11 px-3 hover:bg-brand-green/10 hover:text-brand-green"
                onClick={() => {
                  window.location.href = `mailto:${application.applicant.email}`;
                }}
              >
                <Mail className="h-4 w-4 mr-3 text-brand-green" />
                Send Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Brand Rating Dialog for DJs */}
      <Dialog open={brandRatingDialogOpen} onOpenChange={setBrandRatingDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={textStyles.subheading.large}>
              Rate Your Experience
            </DialogTitle>
            <DialogDescription className={textStyles.body.regular}>
              Share your feedback about working with {application?.opportunity || "this brand"}
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
                    onClick={() => setBrandRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= brandRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {brandRating > 0 && (
                <p className="text-sm text-muted-foreground">
                  {brandRating} {brandRating === 1 ? "star" : "stars"} selected
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand-rating-comment" className={textStyles.body.regular}>
                Feedback (Optional)
              </Label>
              <Textarea
                id="brand-rating-comment"
                placeholder="Share your experience working with this brand..."
                value={brandRatingComment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setBrandRatingComment(e.target.value)
                }
                className="bg-secondary border-border text-foreground min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {brandRatingComment.length}/500 characters
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBrandRatingDialogOpen(false);
                setBrandRating(0);
                setBrandRatingComment("");
              }}
              className="border-border text-foreground hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitBrandRating}
              className="bg-brand-green text-brand-black hover:bg-brand-green/90"
              disabled={brandRating === 0 || isSubmittingRating}
            >
              <Star className="h-4 w-4 mr-2" />
              {isSubmittingRating ? "Submitting..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ApplicantConversationDialog
        open={conversationOpen}
        onOpenChange={setConversationOpen}
        applicantUserId={application?.userId ?? null}
        applicantName={application?.applicant?.name ?? "DJ"}
        opportunityId={application?.opportunityId ?? null}
        organizerId={application?.organizerId ?? null}
      />
    </div>
  );
}
