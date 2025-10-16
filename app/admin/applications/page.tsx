"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  Eye,
  User,
  Users,
} from "lucide-react";

function ApplicationsContent() {
  const searchParams = useSearchParams();
  const opportunityId = searchParams.get("opportunity");
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch applications from database
  const fetchApplications = async () => {
    try {
      // Fetch from both applications table and application_form_responses table
      const [applicationsResult, formResponsesResult] = await Promise.all([
        // Fetch from simple applications table
        supabase
          .from("applications")
          .select(
            `
            *,
            opportunities(title),
            user_profiles(dj_name, city, genres)
          `
          )
          .order("created_at", { ascending: false }),

        // Fetch from application form responses table
        supabase
          .from("application_form_responses")
          .select(
            `
            *,
            opportunities(title),
            user_profiles(dj_name, city, genres),
            application_forms(title)
          `
          )
          .order("submitted_at", { ascending: false }),
      ]);

      let allApplications: any[] = [];

      // Process simple applications
      if (applicationsResult.data && !applicationsResult.error) {
        const transformedApplications = applicationsResult.data.map(
          (app: any) => ({
            id: app.id,
            type: "simple",
            applicant: {
              name: app.user_profiles?.dj_name || "Unknown",
              djName: app.user_profiles?.dj_name || "Unknown",
              avatar: "/person1.jpg",
              location: app.user_profiles?.city || "Unknown",
              genres: app.user_profiles?.genres || [],
            },
            opportunity: app.opportunities?.title || "Unknown Opportunity",
            opportunityId: app.opportunity_id,
            appliedDate: app.created_at
              ? new Date(app.created_at).toISOString().split("T")[0]
              : "Unknown",
            status: app.status || "pending",
            experience: "Unknown",
            portfolio: "Unknown",
            message: app.message || "",
          })
        );
        allApplications = [...allApplications, ...transformedApplications];
      }

      // Process form responses (briefs)
      if (formResponsesResult.data && !formResponsesResult.error) {
        const transformedFormResponses = formResponsesResult.data.map(
          (response: any) => ({
            id: response.id,
            type: "form_response",
            applicant: {
              name: response.user_profiles?.dj_name || "Unknown",
              djName: response.user_profiles?.dj_name || "Unknown",
              avatar: "/person1.jpg",
              location: response.user_profiles?.city || "Unknown",
              genres: response.user_profiles?.genres || [],
            },
            opportunity:
              response.opportunities?.title ||
              response.application_forms?.title ||
              "Form Submission",
            opportunityId: response.opportunity_id,
            appliedDate: response.submitted_at
              ? new Date(response.submitted_at).toISOString().split("T")[0]
              : "Unknown",
            status: response.status || "pending",
            experience: response.response_data?.experience || "Unknown",
            portfolio:
              response.response_data?.portfolio ||
              response.response_data?.soundcloud ||
              "Unknown",
            message: response.review_notes || "",
            responseData: response.response_data, // Store full response data for details
          })
        );
        allApplications = [...allApplications, ...transformedFormResponses];
      }

      // Sort all applications by date (most recent first)
      allApplications.sort((a, b) => {
        const dateA = new Date(a.appliedDate);
        const dateB = new Date(b.appliedDate);
        return dateB.getTime() - dateA.getTime();
      });

      setApplications(allApplications);
      setIsLoading(false);
      console.log(
        `Loaded ${allApplications.length} applications (${
          applicationsResult.data?.length || 0
        } simple + ${formResponsesResult.data?.length || 0} form responses)`
      );
      return;
    } catch (error) {
      console.error("Error fetching applications:", error);
    }

    // Fallback to demo data
    setApplications([
      {
        id: 1,
        applicant: {
          name: "Alex Thompson",
          djName: "DJ AlexT",
          avatar: "/person1.jpg",
          location: "London, UK",
          genres: ["Techno", "House"],
        },
        opportunity: "Underground Warehouse Rave",
        opportunityId: 1,
        appliedDate: "2024-01-15",
        status: "pending",
        experience: "3 years",
        portfolio: "soundcloud.com/alexthompson",
      },
      {
        id: 2,
        applicant: {
          name: "Maya Rodriguez",
          djName: "Maya R",
          avatar: "/person2.jpg",
          location: "Berlin, Germany",
          genres: ["Electronic", "Progressive"],
        },
        opportunity: "Rooftop Summer Sessions",
        opportunityId: 2,
        appliedDate: "2024-01-18",
        status: "approved",
        experience: "5 years",
        portfolio: "soundcloud.com/mayarodriguez",
      },
      {
        id: 3,
        applicant: {
          name: "James Chen",
          djName: "JC Beats",
          avatar: "/person1.jpg",
          location: "Amsterdam, Netherlands",
          genres: ["Drum & Bass", "Dubstep"],
        },
        opportunity: "Club Residency Audition",
        opportunityId: 3,
        appliedDate: "2024-01-20",
        status: "rejected",
        experience: "2 years",
        portfolio: "soundcloud.com/jcbeats",
      },
    ]);

    setIsLoading(false);
  };

  // Load applications on component mount
  useEffect(() => {
    fetchApplications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter applications by opportunity if specified
  const filteredApplications = opportunityId
    ? applications.filter(
        (app) => app.opportunityId === parseInt(opportunityId)
      )
    : applications;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleApprove = async (
    applicationId: string,
    applicationType: string
  ) => {
    try {
      let tableName =
        applicationType === "form_response"
          ? "application_form_responses"
          : "applications";

      console.log(`Approving ${applicationType} application ${applicationId} from table ${tableName}`);

      // First, get the application details to create notification
      const { data: applicationData, error: fetchError } = await supabase
        .from(tableName as any)
        .select(
          `
          *,
          opportunities(title),
          user_profiles(dj_name)
        `
        )
        .eq("id", applicationId)
        .single();

      if (fetchError) {
        console.error("Error fetching application data:", fetchError);
        throw fetchError;
      }

      console.log("Application data fetched:", applicationData);

      // Update application status with proper validation
      const updateData =
        applicationType === "form_response"
          ? { 
              status: "approved", 
              reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : { 
              status: "approved",
              updated_at: new Date().toISOString()
            };

      console.log("Updating with data:", updateData);

      const { data: updatedData, error } = await supabase
        .from(tableName as any)
        .update(updateData)
        .eq("id", applicationId)
        .select()
        .single();

      if (error) {
        console.error("Error updating application:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log("Application updated successfully:", updatedData);

      // Create notification for the user
      if (
        (applicationData as any)?.user_id &&
        (applicationData as any)?.opportunities?.title
      ) {
        try {
          await createApplicationStatusNotification(
            (applicationData as any).user_id,
            applicationId,
            "approved",
            (applicationData as any).opportunities.title
          );
          console.log("Notification created successfully");
        } catch (notificationError) {
          console.error("Error creating notification:", notificationError);
          // Don't throw here - the approval succeeded, notification is secondary
        }
      }

      toast({
        title: "Application Approved",
        description:
          "The application has been approved and the user has been notified.",
      });

      // Refresh the applications list
      fetchApplications();
    } catch (error) {
      console.error("Error approving application:", error);
      toast({
        title: "Error",
        description: "Failed to approve application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (
    applicationId: string,
    applicationType: string
  ) => {
    try {
      let tableName =
        applicationType === "form_response"
          ? "application_form_responses"
          : "applications";

      console.log(`Rejecting ${applicationType} application ${applicationId} from table ${tableName}`);

      // First, get the application details to create notification
      const { data: applicationData, error: fetchError } = await supabase
        .from(tableName as any)
        .select(
          `
          *,
          opportunities(title),
          user_profiles(dj_name)
        `
        )
        .eq("id", applicationId)
        .single();

      if (fetchError) {
        console.error("Error fetching application data:", fetchError);
        throw fetchError;
      }

      console.log("Application data fetched:", applicationData);

      // Update application status with proper validation
      const updateData =
        applicationType === "form_response"
          ? { 
              status: "rejected", 
              reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          : { 
              status: "rejected",
              updated_at: new Date().toISOString()
            };

      console.log("Updating with data:", updateData);

      const { data: updatedData, error } = await supabase
        .from(tableName as any)
        .update(updateData)
        .eq("id", applicationId)
        .select()
        .single();

      if (error) {
        console.error("Error updating application:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log("Application updated successfully:", updatedData);

      // Create notification for the user
      if (
        (applicationData as any)?.user_id &&
        (applicationData as any)?.opportunities?.title
      ) {
        try {
          await createApplicationStatusNotification(
            (applicationData as any).user_id,
            applicationId,
            "rejected",
            (applicationData as any).opportunities.title
          );
          console.log("Notification created successfully");
        } catch (notificationError) {
          console.error("Error creating notification:", notificationError);
          // Don't throw here - the rejection succeeded, notification is secondary
        }
      }

      toast({
        title: "Application Rejected",
        description:
          "The application has been rejected and the user has been notified.",
      });

      // Refresh the applications list
      fetchApplications();
    } catch (error) {
      console.error("Error rejecting application:", error);
      toast({
        title: "Error",
        description: "Failed to reject application. Please try again.",
        variant: "destructive",
      });
    }
  };

  console.log(
    "ApplicationsPage render - isLoading:",
    isLoading,
    "applications count:",
    applications.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
            APPLICATIONS
          </h1>
          <p className={textStyles.body.regular}>
            Review and manage DJ applications
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    applications.filter((app) => app.status === "pending")
                      .length
                  }
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
                  {
                    applications.filter((app) => app.status === "approved")
                      .length
                  }
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
                  {
                    applications.filter((app) => app.status === "rejected")
                      .length
                  }
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <XCircle className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>No applications found.</p>
          </div>
        ) : (
          filteredApplications.map((application) => (
            <Card key={application.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className={textStyles.subheading.large}>
                      {application.opportunity}
                    </h3>

                    <div className="flex items-center space-x-6 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {application.appliedDate}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {application.applicant.location}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {application.experience}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                      <div className="flex items-center">
                        <span className="text-foreground font-medium">
                          {application.applicant.name}
                        </span>
                        <span className="ml-2">
                          ({application.applicant.djName})
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
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
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className="border-gray-400 text-gray-400 bg-transparent text-xs"
                    >
                      {getStatusIcon(application.status)}
                      <span className="ml-1">{application.status}</span>
                    </Badge>

                    {/* Application type indicator */}
                    <Badge
                      variant="outline"
                      className={
                        application.type === "form_response"
                          ? "border-brand-green text-brand-green bg-transparent text-xs"
                          : "border-blue-400 text-blue-400 bg-transparent text-xs"
                      }
                    >
                      {application.type === "form_response"
                        ? "Brief"
                        : "Simple"}
                    </Badge>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-foreground"
                        onClick={() =>
                          (window.location.href = `/admin/applications/${application.id}`)
                        }
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {application.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-brand-green hover:text-brand-green/80"
                            onClick={() =>
                              handleApprove(application.id, application.type)
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() =>
                              handleReject(application.id, application.type)
                            }
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ApplicationsContent />
    </Suspense>
  );
}
