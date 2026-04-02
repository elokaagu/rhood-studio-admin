"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { createApplicationStatusNotification } from "@/lib/notifications";
import {
  Calendar,
  MapPin,
  Music,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  User,
  Mail,
  ExternalLink,
  Play,
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
import {
  getApplicationDetails,
  submitBrandRating,
  updateApplicationStatus,
} from "@/lib/applications/service";
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
        await createApplicationStatusNotification(
          application.userId,
          applicationId,
          nextStatus,
          application.opportunity
        );
      }

      setApplication((prev: ApplicationDetails | null) =>
        prev ? { ...prev, status: nextStatus } : prev
      );
      toast({
        title: nextStatus === "approved" ? "Application Approved" : "Application Rejected",
        description:
          nextStatus === "approved"
            ? "The application has been approved and the user has been notified."
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
          <p className={textStyles.body.regular}>Loading application...</p>
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/applications")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className={textStyles.headline.section}>APPLICATION DETAILS</h1>
            <p className={textStyles.body.regular}>
              Review application information
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(application.status)}
          {application.status === "pending" && (
            <>
              <Button
                variant="outline"
                className="border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-black transition-colors"
                onClick={() => handleStatusUpdate("approved")}
                disabled={isUpdatingStatus}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
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

      {/* Application Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Applicant Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16 bg-brand-green">
                  <AvatarImage
                    src={application.applicant.avatar}
                    alt={application.applicant.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="text-brand-black font-bold text-lg">
                    {application.applicant.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className={textStyles.subheading.large}>
                    {application.applicant.name}
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {application.applicant.location}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Mail className="h-4 w-4 mr-1" />
                    {application.applicant.email}
                  </div>
                </div>
              </div>

              <div>
                <h4 className={textStyles.subheading.small}>Bio</h4>
                <p className={textStyles.body.regular}>
                  {application.applicant.bio}
                </p>
              </div>

              <div className="pb-3">
                <h4 className={textStyles.subheading.small}>Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {application.applicant.genres.map((genre: string) => (
                    <Badge
                      key={genre}
                      variant="outline"
                      className="border-brand-green text-brand-green bg-transparent text-xs font-bold uppercase"
                    >
                      <Music className="h-3 w-3 mr-1" />
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Social Media Links */}
              {(application.applicant.instagram ||
                application.applicant.soundcloud) && (
                <div>
                  <h4 className={textStyles.subheading.small}>Social Media</h4>
                  <div className="flex flex-wrap gap-2">
                    {application.applicant.instagram && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-foreground"
                        onClick={() =>
                          window.open(application.applicant.instagram, "_blank")
                        }
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Instagram
                      </Button>
                    )}
                    {application.applicant.soundcloud && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-foreground"
                        onClick={() =>
                          window.open(
                            application.applicant.soundcloud,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        SoundCloud
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Application Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className={textStyles.subheading.small}>Opportunity</h4>
                <p className={textStyles.body.regular}>
                  {application.opportunity}
                </p>
              </div>
              
              {/* Listen to Audio ID */}
              <div className="pb-3">
                <h4 className={textStyles.subheading.small}>Audio ID</h4>
                {userMix ? (
                  <Button
                    variant="outline"
                    className="border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-black transition-colors"
                    onClick={() => {
                      // Use file_url since playback_url doesn't exist in the schema
                      const fileUrl = userMix?.file_url || null;
                      if (fileUrl) {
                        window.open(fileUrl, "_blank");
                        return;
                      }
                      if (userMix?.id) {
                        router.push(`/admin/mixes/${userMix.id}`);
                        return;
                      }
                      toast({
                        title: "Mix URL Missing",
                        description: "This mix doesn't have a valid file URL.",
                        variant: "destructive",
                      });
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Listen to Audio ID
                  </Button>
                ) : (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive font-medium">No Mix Available</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This user hasn&apos;t uploaded any mixes yet.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Application Status */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className={textStyles.subheading.small}>
                Application Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={textStyles.body.regular}>Status</span>
                {getStatusBadge(application.status)}
              </div>

              <div className="flex items-center justify-between">
                <span className={textStyles.body.regular}>Applied Date</span>
                <span className={textStyles.subheading.small}>
                  {application.appliedDate}
                </span>
              </div>

              {/* Show gig completion status and rating option for DJs */}
              {currentUserRole === "dj" && application.gigCompleted && (
                <div className="pt-4 border-t border-border">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={textStyles.body.regular}>Gig Status</span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                    
                    {existingBrandRating ? (
                      <div className="space-y-2">
                        <p className={textStyles.body.small}>Your Rating:</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= existingBrandRating.stars
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({existingBrandRating.stars} stars)
                          </span>
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
                </div>
              )}
            </CardContent>
          </Card>

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
                onClick={() =>
                  router.push(
                    `/admin/opportunities/${application.opportunityId}`
                  )
                }
              >
                <Calendar className="h-4 w-4 mr-2" />
                View Opportunity
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  (window.location.href = `mailto:${application.applicant.email}`)
                }
              >
                <Mail className="h-4 w-4 mr-2" />
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
    </div>
  );
}
