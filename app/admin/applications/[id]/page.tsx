"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/date-utils";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id;
  const { toast } = useToast();
  const [application, setApplication] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userMix, setUserMix] = useState<any>(null);

  // Handle application approval
  const handleApprove = async () => {
    try {
      // Update application status
      const { error } = await supabase
        .from("applications")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", applicationId as string);

      if (error) {
        throw error;
      }

      // Create notification for the user
      if (application?.user_id && application?.opportunity) {
        await createApplicationStatusNotification(
          application.user_id,
          applicationId as string,
          "approved",
          application.opportunity
        );
      }

      toast({
        title: "Application Approved",
        description:
          "The application has been approved and the user has been notified.",
      });

      // Refresh the application data
      fetchApplication();
    } catch (error) {
      console.error("Error approving application:", error);
      toast({
        title: "Error",
        description: "Failed to approve application. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle application rejection
  const handleReject = async () => {
    try {
      // Update application status
      const { error } = await supabase
        .from("applications")
        .update({ status: "rejected" })
        .eq("id", applicationId as string);

      if (error) {
        throw error;
      }

      // Create notification for the user
      if (application?.user_id && application?.opportunity) {
        await createApplicationStatusNotification(
          application.user_id,
          applicationId as string,
          "rejected",
          application.opportunity
        );
      }

      toast({
        title: "Application Rejected",
        description:
          "The application has been rejected and the user has been notified.",
      });

      // Refresh the application data
      fetchApplication();
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast({
        title: "Error",
        description: "Failed to reject application. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch application from database
  const fetchApplication = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          *,
          opportunities!inner(title, description, location, event_date, payment, genre),
          user_profiles!inner(dj_name, city, genres, email, bio, profile_image_url, instagram, soundcloud)
        `
        )
        .eq("id", applicationId as string)
        .single();

      if (error) {
        // Check if it's a table doesn't exist error
        if (
          error.message?.includes("relation") &&
          error.message?.includes("does not exist")
        ) {
          console.warn(
            "Applications table doesn't exist yet. Using demo data."
          );
          toast({
            title: "Database Setup Required",
            description:
              "Applications table not found. Please create it in Supabase dashboard. Using demo data for now.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else if (data) {
        // Fetch user's mix
        let userMixData = null;
        if (data.user_id) {
          try {
            const { data: mixData, error: mixError } = await supabase
              .from("mixes")
              .select("*")
              .eq("uploaded_by", data.user_id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(); // Use maybeSingle() instead of single() to handle no results gracefully

            if (mixError) {
              console.error("Error fetching user mix:", mixError);
              console.error("Mix error details:", {
                code: mixError.code,
                message: mixError.message,
                details: mixError.details,
                hint: mixError.hint,
              });
            } else if (mixData) {
              console.log("Found user mix:", mixData);
              userMixData = mixData;
            } else {
              console.log("No mix found for user:", data.user_id);
            }
          } catch (mixErr) {
            console.error("Exception fetching user mix:", mixErr);
          }
        }

        // Transform the data to match the expected format
        const transformedApplication = {
          id: data.id,
          applicant: {
            name: data.user_profiles?.dj_name || "Unknown",
            avatar: data.user_profiles?.profile_image_url || "/person1.jpg", // Use actual profile image or fallback
            location: data.user_profiles?.city || "Unknown",
            genres: data.user_profiles?.genres || [],
            email: data.user_profiles?.email || "Unknown",
            bio: data.user_profiles?.bio || "No bio available",
            instagram: data.user_profiles?.instagram || null,
            soundcloud: data.user_profiles?.soundcloud || null,
          },
          opportunity: data.opportunities?.title || "Unknown Opportunity",
          opportunityId: data.opportunity_id,
          appliedDate: data.created_at
            ? formatDate(data.created_at)
            : "Unknown",
          status: data.status || "pending",
          coverLetter: data.message || "No cover letter provided",
          userId: data.user_id,
        };

        setApplication(transformedApplication);
        setUserMix(userMixData);
        setIsLoading(false);
        return; // Exit early if successful
      }
    } catch (error) {
      console.error("Error fetching application:", error);
      toast({
        title: "Database Error",
        description:
          "Failed to load application from database. Using demo data.",
        variant: "destructive",
      });
    }

    // Fallback to demo data
    const applications = [
      {
        id: 1,
        applicant: {
          name: "Alex Thompson",
          avatar: "/person1.jpg",
          location: "London, UK",
          genres: ["Techno", "House"],
          email: "alex.thompson@email.com",
          bio: "Passionate techno DJ with 3+ years of experience in underground venues across London.",
          instagram: "https://instagram.com/alexthompson",
          soundcloud: "https://soundcloud.com/alexthompson",
        },
        opportunity: "Underground Warehouse Rave",
        opportunityId: 1,
        appliedDate: "2024-01-15",
        status: "pending",
        coverLetter:
          "I'm excited to apply for this opportunity. I have extensive experience playing techno sets in underground venues and would love to bring my energy to this event.",
      },
      {
        id: 2,
        applicant: {
          name: "Maya Rodriguez",
          avatar: "/person2.jpg",
          location: "Berlin, Germany",
          genres: ["Electronic", "Progressive"],
          email: "maya.rodriguez@email.com",
          bio: "Electronic music producer and DJ based in Berlin, specializing in progressive house and techno.",
          instagram: "https://instagram.com/mayarodriguez",
          soundcloud: "https://soundcloud.com/mayarodriguez",
        },
        opportunity: "Rooftop Summer Sessions",
        opportunityId: 2,
        appliedDate: "2024-01-18",
        status: "approved",
        coverLetter:
          "As a Berlin-based DJ, I bring a unique perspective to house music. I'm excited about the opportunity to play at this rooftop venue.",
      },
      {
        id: 3,
        applicant: {
          name: "James Chen",
          avatar: "/person1.jpg",
          location: "Amsterdam, Netherlands",
          genres: ["Drum & Bass", "Dubstep"],
          email: "james.chen@email.com",
          bio: "Drum & Bass enthusiast with a passion for high-energy sets and crowd interaction.",
          instagram: null,
          soundcloud: "https://soundcloud.com/jcbeats",
        },
        opportunity: "Club Residency Audition",
        opportunityId: 3,
        appliedDate: "2024-01-20",
        status: "rejected",
        coverLetter:
          "I'm applying for this residency opportunity to showcase my drum & bass skills and build a long-term relationship with the venue.",
      },
    ];

    const foundApplication = applications.find(
      (app) => app.id === parseInt(applicationId as string)
    );

    setApplication(foundApplication || applications[0]);
    setIsLoading(false);
  };

  // Load application on component mount
  useEffect(() => {
    fetchApplication();
  }, [applicationId]); // eslint-disable-line react-hooks/exhaustive-deps

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
                onClick={handleApprove}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={handleReject}
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

              <div>
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
              <div>
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
                      This user hasn't uploaded any mixes yet.
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
    </div>
  );
}
