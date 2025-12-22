"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/date-utils";
import { supabase } from "@/integrations/supabase/client";
import { createApplicationStatusNotification, triggerApplicationDecisionEmail } from "@/lib/notifications";
import { getCurrentUserProfile, getCurrentUserId } from "@/lib/auth-utils";
import {
  Calendar,
  MapPin,
  Music,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  User,
  Search,
} from "lucide-react";

function ApplicationsContent() {
  const searchParams = useSearchParams();
  const opportunityId = searchParams.get("opportunity");
  const { toast } = useToast();
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name_asc" | "name_desc" | "opportunity_asc" | "opportunity_desc">("newest");

  // Fetch applications from database
  const fetchApplications = async () => {
    try {
      const userProfile = await getCurrentUserProfile();
      const userId = await getCurrentUserId();

      // For brands, first get their opportunity IDs
      let brandOpportunityIds: string[] | null = null;
      if (userProfile?.role === "brand" && userId) {
        const { data: brandOpportunities } = await supabase
          .from("opportunities")
          .select("id")
          .eq("organizer_id", userId);
        brandOpportunityIds = brandOpportunities?.map((opp) => opp.id) || [];
      }

      // Build queries based on user role
      let applicationsQuery = supabase
        .from("applications")
        .select(
          `
            *,
            opportunities(title, organizer_id),
            user_profiles(dj_name, first_name, last_name, city, location, genres, email)
          `
        );

      let formResponsesQuery = supabase
        .from("application_form_responses")
        .select(
          `
            *,
            opportunities(title, organizer_id),
            user_profiles(dj_name, first_name, last_name, city, location, genres, email),
            application_forms(title)
          `
        );

      // Filter by specific opportunity if specified in URL
      if (opportunityId) {
        applicationsQuery = applicationsQuery.eq("opportunity_id", opportunityId);
        formResponsesQuery = formResponsesQuery.eq("opportunity_id", opportunityId);
      }

      // Filter by brand's opportunities if user is a brand
      if (userProfile?.role === "brand" && brandOpportunityIds) {
        if (brandOpportunityIds.length === 0) {
          // No opportunities, so no applications
          setApplications([]);
          setIsLoading(false);
          return;
        }
        applicationsQuery = applicationsQuery.in(
          "opportunity_id",
          brandOpportunityIds
        );
        formResponsesQuery = formResponsesQuery.in(
          "opportunity_id",
          brandOpportunityIds
        );
      }

      // Fetch from both applications table and application_form_responses table
      const [applicationsResult, formResponsesResult] = await Promise.all([
        applicationsQuery.order("created_at", { ascending: false }),
        formResponsesQuery.order("submitted_at", { ascending: false }),
      ]);

      let allApplications: any[] = [];

      // Process simple applications
      if (applicationsResult.data && !applicationsResult.error) {
        console.log("Simple applications data:", applicationsResult.data);
        const transformedApplications = applicationsResult.data.map(
          (app: any) => {
            console.log("Processing application:", app);
            return {
              id: app.id,
              type: "simple",
              applicant: {
                name:
                  app.user_profiles?.dj_name ||
                  app.user_profiles?.first_name ||
                  "Unknown",
                djName:
                  app.user_profiles?.dj_name ||
                  app.user_profiles?.first_name ||
                  "Unknown",
                avatar: "/person1.jpg",
                location:
                  app.user_profiles?.city ||
                  app.user_profiles?.location ||
                  "Unknown",
                genres: app.user_profiles?.genres || [],
              },
              opportunity: app.opportunities?.title || "Unknown Opportunity",
              opportunityId: app.opportunity_id,
              appliedDate: app.created_at
                ? formatDate(app.created_at)
                : "Unknown",
              status: app.status || "pending",
              portfolio: "Unknown",
              message: app.message || "",
            };
          }
        );
        allApplications = [...allApplications, ...transformedApplications];
      }

      // Process form responses (briefs)
      if (formResponsesResult.data && !formResponsesResult.error) {
        console.log("Form responses data:", formResponsesResult.data);
        const transformedFormResponses = formResponsesResult.data.map(
          (response: any) => {
            console.log("Processing form response:", response);
            return {
              id: response.id,
              type: "form_response",
              applicant: {
                name:
                  response.user_profiles?.dj_name ||
                  response.user_profiles?.first_name ||
                  "Unknown",
                djName:
                  response.user_profiles?.dj_name ||
                  response.user_profiles?.first_name ||
                  "Unknown",
                avatar: "/person1.jpg",
                location:
                  response.user_profiles?.city ||
                  response.user_profiles?.location ||
                  "Unknown",
                genres: response.user_profiles?.genres || [],
              },
              opportunity:
                response.opportunities?.title ||
                response.application_forms?.title ||
                "Form Submission",
              opportunityId: response.opportunity_id,
              appliedDate: response.submitted_at
                ? formatDate(response.submitted_at)
                : "Unknown",
              status: response.status || "pending",
              portfolio:
                response.response_data?.portfolio ||
                response.response_data?.soundcloud ||
                "Unknown",
              message: response.review_notes || "",
              responseData: response.response_data, // Store full response data for details
            };
          }
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
          return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime();
        case "oldest":
          return new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
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
        return <CheckCircle className="h-4 w-4 text-foreground" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-foreground" />;
      case "pending":
        return <Clock className="h-4 w-4 text-foreground" />;
      default:
        return <Clock className="h-4 w-4 text-foreground" />;
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

      console.log(
        `Approving ${applicationType} application ${applicationId} from table ${tableName}`
      );

      // Get user profile first for role checking
      const userProfile = await getCurrentUserProfile();
      const userId = await getCurrentUserId();

      // First, get the application details - fetch without joins to avoid venue field issues
      const { data: applicationBasic, error: fetchBasicError } = await supabase
        .from(tableName as any)
        .select("*")
        .eq("id", applicationId)
        .single();

      if (fetchBasicError || !applicationBasic) {
        console.error("Error fetching application data:", fetchBasicError);
        throw fetchBasicError || new Error("Application not found");
      }

      // Type assertion since we've checked for errors and existence
      const application = applicationBasic as any;

      // For brand role validation, fetch opportunity organizer_id separately if needed
      if (userProfile?.role === "brand" && userId && application?.opportunity_id) {
        const { data: opportunity } = await supabase
          .from("opportunities")
          .select("organizer_id, title")
          .eq("id", application.opportunity_id)
          .single();

        if (opportunity && (opportunity as any).organizer_id !== userId) {
          toast({
            title: "Access Denied",
            description:
              "You can only approve/reject applications for your own opportunities.",
            variant: "destructive",
          });
          return;
        }
      }

      // Fetch user profile and opportunity details separately for notification
      const [userProfileResult, opportunityResult] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("dj_name, first_name, last_name, email")
          .eq("id", application.user_id)
          .single(),
        application?.opportunity_id
          ? supabase
              .from("opportunities")
              .select("title")
              .eq("id", application.opportunity_id)
              .single()
          : Promise.resolve({ data: null, error: null }),
      ]);

      const applicationData = {
        ...application,
        user_profiles: userProfileResult.data,
        opportunities: opportunityResult.data,
      };

      console.log("Application data fetched:", applicationData);

      // Update application status with proper validation
      const updateData =
        applicationType === "form_response"
          ? {
              status: "approved",
              reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : {
              status: "approved",
              updated_at: new Date().toISOString(),
            };

      console.log("Updating with data:", updateData);

      // Try using RPC function first to bypass RLS (avoids venue field error)
      const newStatus = updateData.status;
      const rpcFunctionName = 
        applicationType === "form_response" 
          ? "admin_update_form_response_status"
          : "admin_update_application_status";
      
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        rpcFunctionName,
        {
          p_application_id: applicationId,
          p_new_status: newStatus,
        }
      );

      let error = null;
      
      // If RPC works, use it; otherwise fall back to direct update
      if (!rpcError && rpcResult?.success) {
        console.log("Application updated via RPC function (bypassed RLS)");
      } else if (rpcError) {
        console.warn("RPC function not available, falling back to direct update:", rpcError);
        // Fall back to direct update
        const updateResult = await supabase
          .from(tableName as any)
          .update(updateData)
          .eq("id", applicationId);
        error = updateResult.error;
      } else {
        // RPC returned but wasn't successful
        error = new Error(rpcResult?.error || "RPC function returned unsuccessful result");
      }

      if (error) {
        console.error("Error updating application:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        
        // If error is about venue field, provide helpful message
        if (error.message?.includes("venue") || error.message?.includes("v_opportunity")) {
          console.error("Venue field error detected. This might be due to a view or RLS policy referencing a non-existent field.");
          toast({
            title: "Update Error",
            description: "Database schema issue detected. Please run the migration: supabase/migrations/20250122000006_fix_venue_error_rpc_bypass.sql in your Supabase SQL Editor. Also verify your user has role='admin' in user_profiles.",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      console.log("Application updated successfully");

      const opportunityTitle =
        (applicationData as any)?.opportunities?.title ||
        (applicationData as any)?.application_forms?.title ||
        "Opportunity";

      // Create notification for the user
      if (
        application?.user_id &&
        opportunityTitle
      ) {
        try {
          await createApplicationStatusNotification(
            application.user_id,
            applicationId,
            "approved",
            opportunityTitle
          );
          console.log("Notification created successfully");

          const profile = (applicationData as any).user_profiles;
          if (profile?.email) {
            const fullName =
              profile.dj_name ||
              [profile.first_name, profile.last_name]
                .filter(Boolean)
                .join(" ") ||
              null;

            const emailResult = await triggerApplicationDecisionEmail({
              email: profile.email,
              applicantName: fullName,
              status: "approved",
              opportunityTitle,
            });
            if (!emailResult?.success) {
              console.warn("Failed to send approval email:", emailResult);
              toast({
                title: "Email Not Sent",
                description:
                  "Approval email could not be delivered automatically. Please double-check your email settings.",
                variant: "destructive",
              });
            }
          }
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

      console.log(
        `Rejecting ${applicationType} application ${applicationId} from table ${tableName}`
      );

      // Get user profile first for role checking
      const userProfile = await getCurrentUserProfile();
      const userId = await getCurrentUserId();

      // First, get the application details - fetch without joins to avoid venue field issues
      const { data: applicationBasic, error: fetchBasicError } = await supabase
        .from(tableName as any)
        .select("*")
        .eq("id", applicationId)
        .single();

      if (fetchBasicError || !applicationBasic) {
        console.error("Error fetching application data:", fetchBasicError);
        throw fetchBasicError || new Error("Application not found");
      }

      // Type assertion since we've checked for errors and existence
      const application = applicationBasic as any;

      // For brand role validation, fetch opportunity organizer_id separately if needed
      if (userProfile?.role === "brand" && userId && application?.opportunity_id) {
        const { data: opportunity } = await supabase
          .from("opportunities")
          .select("organizer_id, title")
          .eq("id", application.opportunity_id)
          .single();

        if (opportunity && (opportunity as any).organizer_id !== userId) {
          toast({
            title: "Access Denied",
            description:
              "You can only approve/reject applications for your own opportunities.",
            variant: "destructive",
          });
          return;
        }
      }

      // Fetch user profile and opportunity details separately for notification
      const [userProfileResult, opportunityResult] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("dj_name, first_name, last_name, email")
          .eq("id", application.user_id)
          .single(),
        application?.opportunity_id
          ? supabase
              .from("opportunities")
              .select("title")
              .eq("id", application.opportunity_id)
              .single()
          : Promise.resolve({ data: null, error: null }),
      ]);

      const applicationData = {
        ...application,
        user_profiles: userProfileResult.data,
        opportunities: opportunityResult.data,
      };

      console.log("Application data fetched:", applicationData);

      // Update application status with proper validation
      const updateData =
        applicationType === "form_response"
          ? {
              status: "rejected",
              reviewed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          : {
              status: "rejected",
              updated_at: new Date().toISOString(),
            };

      console.log("Updating with data:", updateData);

      // Try using RPC function first to bypass RLS (avoids venue field error)
      const newStatus = updateData.status;
      const rpcFunctionName = 
        applicationType === "form_response" 
          ? "admin_update_form_response_status"
          : "admin_update_application_status";
      
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        rpcFunctionName,
        {
          p_application_id: applicationId,
          p_new_status: newStatus,
        }
      );

      let error = null;
      
      // If RPC works, use it; otherwise fall back to direct update
      if (!rpcError && rpcResult?.success) {
        console.log("Application updated via RPC function (bypassed RLS)");
      } else if (rpcError) {
        console.warn("RPC function not available, falling back to direct update:", rpcError);
        // Fall back to direct update
        const updateResult = await supabase
          .from(tableName as any)
          .update(updateData)
          .eq("id", applicationId);
        error = updateResult.error;
      } else {
        // RPC returned but wasn't successful
        error = new Error(rpcResult?.error || "RPC function returned unsuccessful result");
      }

      if (error) {
        console.error("Error updating application:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        
        // If error is about venue field, provide helpful message
        if (error.message?.includes("venue") || error.message?.includes("v_opportunity")) {
          console.error("Venue field error detected. This might be due to a view or RLS policy referencing a non-existent field.");
          toast({
            title: "Update Error",
            description: "Database schema issue detected. Please run the migration: supabase/migrations/20250122000006_fix_venue_error_rpc_bypass.sql in your Supabase SQL Editor. Also verify your user has role='admin' in user_profiles.",
            variant: "destructive",
          });
          return;
        }
        
        throw error;
      }

      console.log("Application updated successfully");

      const opportunityTitle =
        (applicationData as any)?.opportunities?.title ||
        (applicationData as any)?.application_forms?.title ||
        "Opportunity";

      // Create notification for the user
      if (
        application?.user_id &&
        opportunityTitle
      ) {
        try {
          await createApplicationStatusNotification(
            application.user_id,
            applicationId,
            "rejected",
            opportunityTitle
          );
          console.log("Notification created successfully");

          const profile = (applicationData as any).user_profiles;
          if (profile?.email) {
            const fullName =
              profile.dj_name ||
              [profile.first_name, profile.last_name]
                .filter(Boolean)
                .join(" ") ||
              null;

            const emailResult = await triggerApplicationDecisionEmail({
              email: profile.email,
              applicantName: fullName,
              status: "rejected",
              opportunityTitle,
            });
            if (!emailResult?.success) {
              console.warn("Failed to send rejection email:", emailResult);
              toast({
                title: "Email Not Sent",
                description:
                  "Rejection email could not be delivered automatically. Please double-check your email settings.",
                variant: "destructive",
              });
            }
          }
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary border-border text-foreground h-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as typeof statusFilter)}>
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
            <Select value={sortBy} onValueChange={(val) => setSortBy(val as typeof sortBy)}>
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
            <p className={textStyles.body.regular}>Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>No applications found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
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
                        onClick={() =>
                          (window.location.href = `/admin/applications/${application.id}`)
                        }
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
                            onClick={() => handleApprove(application.id, application.type)}
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
                            onClick={() =>
                              handleReject(application.id, application.type)
                            }
                          >
                            <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="hidden sm:inline">Reject</span>
                            <span className="sm:hidden">✗</span>
                          </Button>
                        </>
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
