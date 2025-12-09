"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  FileText,
  Eye,
} from "lucide-react";

export default function FormResponsesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const formId = params.id;
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [fields, setFields] = useState<any[]>([]);

  // Load form data and responses on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch form data
        const { data: formData, error: formError } = await supabase
          .from("application_forms")
          .select(
            `
            *,
            opportunities(title)
          `
          )
          .eq("id", formId as string)
          .single();

        if (formError) {
          throw formError;
        }

        if (formData) {
          setForm(formData);

          // Fetch form fields
          const { data: formFields, error: fieldsError } = await supabase
            .from("application_form_fields")
            .select("*")
            .eq("form_id", formId as string)
            .order("field_order");

          if (fieldsError) {
            console.error("Error fetching form fields:", fieldsError);
          } else {
            setFields(formFields || []);
          }

          // Fetch responses
          const { data: responsesData, error: responsesError } = await supabase
            .from("application_form_responses")
            .select(
              `
              *,
              user_profiles(dj_name, email, first_name, last_name)
            `
            )
            .eq("form_id", formId as string)
            .order("submitted_at", { ascending: false });

          if (responsesError) {
            console.error("Error fetching responses:", responsesError);
          } else {
            setResponses(responsesData || []);
          }
        }
      } catch (error) {
        console.error("Error fetching form data:", error);
        toast({
          title: "Error",
          description: "Failed to load form data. Using demo data.",
          variant: "destructive",
        });

        // Fallback to demo data
        setForm({
          id: formId,
          title: "Barcelona Beach Club",
          description: "Application form for Barcelona Beach Club residency",
          opportunities: { title: "Barcelona Beach Club" },
        });
        setFields([
          {
            id: "field_1",
            field_name: "dj_name",
            field_label: "DJ Name",
            field_type: "text",
          },
          {
            id: "field_2",
            field_name: "experience",
            field_label: "Years of Experience",
            field_type: "select",
          },
        ]);
        setResponses([
          {
            id: "response_1",
            response_data: {
              dj_name: "DJ Alex",
              experience: "5+ years",
            },
            status: "submitted",
            submitted_at: "2024-01-15T10:00:00Z",
            user_profiles: {
              dj_name: "DJ Alex",
              email: "alex@example.com",
              first_name: "Alex",
              last_name: "Thompson",
            },
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [formId, toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <Badge className="bg-orange-500 text-white text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        );
      case "under_review":
        return (
          <Badge className="bg-blue-500 text-white text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-500 text-white text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500 text-white text-xs">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500 text-white text-xs">{status}</Badge>
        );
    }
  };

  const updateResponseStatus = async (
    responseId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from("application_form_responses")
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", responseId);

      if (error) {
        throw error;
      }

      // Update local state
      setResponses(
        responses.map((response) =>
          response.id === responseId
            ? {
                ...response,
                status: newStatus,
                reviewed_at: new Date().toISOString(),
              }
            : response
        )
      );

      toast({
        title: "Success",
        description: `Response ${newStatus} successfully!`,
      });
    } catch (error) {
      console.error("Error updating response status:", error);
      toast({
        title: "Error",
        description: "Failed to update response status.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className={textStyles.body.regular}>Loading responses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-blur-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
            Brief Responses
          </h1>
          <p className={textStyles.body.regular}>
            {form?.title} - {responses.length} responses
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Form Info */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`${textStyles.subheading.large} mb-2`}>
                {form?.title}
              </h3>
              <p className={`${textStyles.body.regular} mb-4`}>
                {form?.description}
              </p>
              {form?.opportunities && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 mr-1" />
                  For: {form.opportunities.title}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className={`${textStyles.body.regular} mb-2`}>
                Total Responses: {responses.length}
              </p>
              <div className="flex space-x-2">
                {responses.filter((r) => r.status === "submitted").length >
                  0 && (
                  <Badge variant="outline" className="text-xs">
                    {responses.filter((r) => r.status === "submitted").length}{" "}
                    pending
                  </Badge>
                )}
                {responses.filter((r) => r.status === "approved").length >
                  0 && (
                  <Badge variant="outline" className="text-xs text-green-600">
                    {responses.filter((r) => r.status === "approved").length}{" "}
                    approved
                  </Badge>
                )}
                {responses.filter((r) => r.status === "rejected").length >
                  0 && (
                  <Badge variant="outline" className="text-xs text-red-600">
                    {responses.filter((r) => r.status === "rejected").length}{" "}
                    rejected
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responses List */}
      <div className="space-y-4">
        {responses.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className={textStyles.body.regular}>
              No responses yet. Share the form to start collecting applications.
            </p>
          </div>
        ) : (
          responses.map((response) => (
            <Card key={response.id} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-brand-green/20 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-brand-green" />
                    </div>
                    <div>
                      <h4 className={`${textStyles.subheading.small} mb-1`}>
                        {response.user_profiles?.dj_name ||
                          `${response.user_profiles?.first_name} ${response.user_profiles?.last_name}` ||
                          "Unknown User"}
                      </h4>
                      <p
                        className={`${textStyles.body.small} text-muted-foreground`}
                      >
                        {response.user_profiles?.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(response.status)}
                    <div className="text-right">
                      <p
                        className={`${textStyles.body.small} text-muted-foreground`}
                      >
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {new Date(response.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Response Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {fields.map((field) => (
                    <div key={field.id} className="space-y-1">
                      <Label className={textStyles.body.small}>
                        {field.field_label}
                      </Label>
                      <p className={textStyles.body.regular}>
                        {response.response_data?.[field.field_name] || "N/A"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {response.status === "submitted" && (
                  <div className="flex items-center space-x-2 pt-4 border-t border-border">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() =>
                        updateResponseStatus(response.id, "approved")
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        updateResponseStatus(response.id, "rejected")
                      }
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        updateResponseStatus(response.id, "under_review")
                      }
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Mark Under Review
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
