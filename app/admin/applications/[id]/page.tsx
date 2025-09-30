"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
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
} from "lucide-react";

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id;
  const { toast } = useToast();
  const [application, setApplication] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle application approval
  const handleApprove = async () => {
    try {
      // Update application status
      const { error } = await supabase
        .from("applications")
        .update({ status: "approved" })
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
          user_profiles!inner(dj_name, city, genres, email, bio)
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
        // Transform the data to match the expected format
        const transformedApplication = {
          id: data.id,
          applicant: {
            name: data.user_profiles?.dj_name || "Unknown",
            djName: data.user_profiles?.dj_name || "Unknown",
            avatar: "/person1.jpg", // Default avatar
            location: data.user_profiles?.city || "Unknown",
            genres: data.user_profiles?.genres || [],
            email: data.user_profiles?.email || "Unknown",
            phone: "Unknown", // Phone field doesn't exist in user_profiles
            bio: data.user_profiles?.bio || "No bio available",
          },
          opportunity: data.opportunities?.title || "Unknown Opportunity",
          opportunityId: data.opportunity_id,
          appliedDate: data.created_at
            ? new Date(data.created_at).toISOString().split("T")[0]
            : "Unknown",
          status: data.status || "pending",
          experience: "Unknown", // This field might need to be added to the database
          portfolio: "Unknown", // This field might need to be added to the database
          coverLetter: data.message || "No cover letter provided",
          equipment: "Unknown", // This field might need to be added to the database
        };

        setApplication(transformedApplication);
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
          djName: "DJ AlexT",
          avatar: "/person1.jpg",
          location: "London, UK",
          genres: ["Techno", "House"],
          email: "alex.thompson@email.com",
          phone: "+44 7700 900123",
          bio: "Passionate techno DJ with 3+ years of experience in underground venues across London.",
        },
        opportunity: "Underground Warehouse Rave",
        opportunityId: 1,
        appliedDate: "2024-01-15",
        status: "pending",
        experience: "3 years",
        portfolio: "soundcloud.com/alexthompson",
        coverLetter:
          "I'm excited to apply for this opportunity. I have extensive experience playing techno sets in underground venues and would love to bring my energy to this event.",
        equipment: "Pioneer DDJ-1000, MacBook Pro, Audio-Technica ATH-M50x",
      },
      {
        id: 2,
        applicant: {
          name: "Maya Rodriguez",
          djName: "Maya R",
          avatar: "/person2.jpg",
          location: "Berlin, Germany",
          genres: ["Electronic", "Progressive"],
          email: "maya.rodriguez@email.com",
          phone: "+49 30 12345678",
          bio: "Electronic music producer and DJ based in Berlin, specializing in progressive house and techno.",
        },
        opportunity: "Rooftop Summer Sessions",
        opportunityId: 2,
        appliedDate: "2024-01-18",
        status: "approved",
        experience: "5 years",
        portfolio: "soundcloud.com/mayarodriguez",
        coverLetter:
          "As a Berlin-based DJ, I bring a unique perspective to house music. I'm excited about the opportunity to play at this rooftop venue.",
        equipment: "Pioneer XDJ-RX2, MacBook Air, Sennheiser HD-25",
      },
      {
        id: 3,
        applicant: {
          name: "James Chen",
          djName: "JC Beats",
          avatar: "/person1.jpg",
          location: "Amsterdam, Netherlands",
          genres: ["Drum & Bass", "Dubstep"],
          email: "james.chen@email.com",
          phone: "+31 6 12345678",
          bio: "Drum & Bass enthusiast with a passion for high-energy sets and crowd interaction.",
        },
        opportunity: "Club Residency Audition",
        opportunityId: 3,
        appliedDate: "2024-01-20",
        status: "rejected",
        experience: "2 years",
        portfolio: "soundcloud.com/jcbeats",
        coverLetter:
          "I'm applying for this residency opportunity to showcase my drum & bass skills and build a long-term relationship with the venue.",
        equipment: "Pioneer DDJ-SX3, MacBook Pro, KRK Rokit 5",
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
    <div className="space-y-6">
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
                className="text-brand-green hover:text-brand-green/80"
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
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={application.applicant.avatar}
                    alt={application.applicant.name}
                  />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className={textStyles.subheading.large}>
                    {application.applicant.name}
                  </h3>
                  <p className={textStyles.body.regular}>
                    {application.applicant.djName}
                  </p>
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

              <div>
                <h4 className={textStyles.subheading.small}>Cover Letter</h4>
                <p className={textStyles.body.regular}>
                  {application.coverLetter}
                </p>
              </div>

              <div>
                <h4 className={textStyles.subheading.small}>Equipment</h4>
                <p className={textStyles.body.regular}>
                  {application.equipment}
                </p>
              </div>

              <div>
                <h4 className={textStyles.subheading.small}>Portfolio</h4>
                <a
                  href={`https://${application.portfolio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-brand-green hover:text-brand-green/80"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {application.portfolio}
                </a>
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

              <div className="flex items-center justify-between">
                <span className={textStyles.body.regular}>Experience</span>
                <span className={textStyles.subheading.small}>
                  {application.experience}
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
                  window.open(`https://${application.portfolio}`, "_blank")
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Portfolio
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
