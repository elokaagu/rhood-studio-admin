"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  FileText,
  Users,
  Calendar,
  Settings,
} from "lucide-react";

export default function FormsPage() {
  const { toast } = useToast();
  const [forms, setForms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch forms from database
  const fetchForms = async () => {
    try {
      const { data, error } = await supabase
        .from("application_forms")
        .select(
          `
          *,
          opportunities(title),
          application_form_responses(id, status)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      } else {
        setForms(data || []);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
    }

    // Fallback to demo data
    setForms([
      {
        id: 1,
        title: "DJ Application Form",
        description: "Standard application form for DJ opportunities",
        opportunity_id: null,
        is_active: true,
        created_at: "2024-01-15T10:00:00Z",
        opportunities: null,
        application_form_responses: [
          { id: 1, status: "submitted" },
          { id: 2, status: "approved" },
          { id: 3, status: "rejected" },
        ],
      },
      {
        id: 2,
        title: "Producer Showcase Form",
        description: "Application form for producer showcase events",
        opportunity_id: 1,
        is_active: true,
        created_at: "2024-01-10T14:30:00Z",
        opportunities: { title: "Underground Warehouse Rave" },
        application_form_responses: [
          { id: 4, status: "submitted" },
          { id: 5, status: "under_review" },
        ],
      },
      {
        id: 3,
        title: "Residency Application",
        description: "Form for club residency applications",
        opportunity_id: 2,
        is_active: false,
        created_at: "2024-01-05T09:15:00Z",
        opportunities: { title: "Rooftop Summer Sessions" },
        application_form_responses: [{ id: 6, status: "approved" }],
      },
    ]);

    setIsLoading(false);
  };

  // Load forms on component mount
  useEffect(() => {
    fetchForms();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-500 text-white text-xs">Active</Badge>
    ) : (
      <Badge className="bg-gray-500 text-white text-xs">Inactive</Badge>
    );
  };

  const getResponseStats = (responses: any[]) => {
    const stats = {
      total: responses.length,
      submitted: responses.filter((r) => r.status === "submitted").length,
      approved: responses.filter((r) => r.status === "approved").length,
      rejected: responses.filter((r) => r.status === "rejected").length,
    };
    return stats;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white">
            BRIEFS
          </h1>
          <p className={textStyles.body.regular}>
            Create and manage application briefs
          </p>
        </div>
        <Button
          className="bg-brand-green hover:bg-brand-green/90 text-brand-black"
          onClick={() => (window.location.href = "/admin/forms/create")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Brief
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Briefs</p>
                <p className="text-2xl font-bold text-foreground">
                  {forms.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Briefs</p>
                <p className="text-2xl font-bold text-foreground">
                  {forms.filter((form) => form.is_active).length}
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Settings className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-2xl font-bold text-foreground">
                  {forms.reduce(
                    (total, form) =>
                      total + (form.application_form_responses?.length || 0),
                    0
                  )}
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">
                  {
                    forms.filter((form) => {
                      const formDate = new Date(form.created_at);
                      const now = new Date();
                      return (
                        formDate.getMonth() === now.getMonth() &&
                        formDate.getFullYear() === now.getFullYear()
                      );
                    }).length
                  }
                </p>
              </div>
              <div className="h-8 w-8 bg-brand-green/20 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-brand-green" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forms List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>Loading briefs...</p>
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>
              No briefs found. Create your first application brief!
            </p>
          </div>
        ) : (
          forms.map((form) => {
            const responseStats = getResponseStats(
              form.application_form_responses || []
            );
            return (
              <Card key={form.id} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className={`${textStyles.subheading.large} mb-0`}>
                          {form.title}
                        </h3>
                        {getStatusBadge(form.is_active)}
                      </div>

                      <p className={`${textStyles.body.regular} mb-4`}>
                        {form.description}
                      </p>

                      <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Created{" "}
                          {new Date(form.created_at).toLocaleDateString()}
                        </div>
                        {form.opportunities && (
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            For: {form.opportunities.title}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {responseStats.total} responses
                        </div>
                        {responseStats.submitted > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {responseStats.submitted} pending
                          </Badge>
                        )}
                        {responseStats.approved > 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs text-green-600"
                          >
                            {responseStats.approved} approved
                          </Badge>
                        )}
                        {responseStats.rejected > 0 && (
                          <Badge
                            variant="outline"
                            className="text-xs text-red-600"
                          >
                            {responseStats.rejected} rejected
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-foreground"
                          onClick={() =>
                            (window.location.href = `/admin/forms/${form.id}/responses`)
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Responses
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-foreground"
                          onClick={() =>
                            (window.location.href = `/admin/forms/${form.id}/edit`)
                          }
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-foreground"
                          onClick={() =>
                            (window.location.href = `/admin/forms/${form.id}/duplicate`)
                          }
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicate
                        </Button>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
