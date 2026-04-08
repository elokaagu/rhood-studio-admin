"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
  Edit,
  Trash2,
  Eye,
  Copy,
  FileText,
  Users,
  Calendar,
  Settings,
  MoreVertical,
} from "lucide-react";

export default function FormsPage() {
  const router = useRouter();
  const { toast } = useToast();
  type FormResponseLite = { id: string; status: string | null };
  type FormListItem = {
    id: string;
    title: string;
    description: string | null;
    opportunity_id: string | null;
    is_active: boolean;
    created_at: string;
    opportunities: { title: string | null } | null;
    application_form_responses: FormResponseLite[] | null;
  };

  const [forms, setForms] = useState<FormListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formToDelete, setFormToDelete] = useState<{ id: string; title: string } | null>(null);

  // Fetch forms from database
  const fetchForms = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
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

      if (error) throw error;
      setForms((data ?? []) as FormListItem[]);
    } catch {
      setForms([]);
      setLoadError("Failed to load briefs.");
      toast({
        title: "Error",
        description: "Failed to load briefs. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load forms on component mount
  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleDelete = async (formId: string, formTitle: string) => {
    setFormToDelete({ id: formId, title: formTitle });
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!formToDelete || isDeleting) return;
    setIsDeleting(true);

    try {
      // Delete from Supabase database
      const { error } = await supabase
        .from("application_forms")
        .delete()
        .eq("id", formToDelete.id);

      if (error) {
        throw error;
      }

      // Remove from local state
      setForms((prevForms: FormListItem[]) =>
        prevForms.filter((form: FormListItem) => form.id !== formToDelete.id)
      );

      toast({
        title: "Brief Deleted",
        description: `"${formToDelete.title}" has been deleted successfully.`,
      });
    } catch {
      toast({
        title: "Delete Failed",
        description: "Failed to delete brief. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setFormToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalOpen(false);
    setFormToDelete(null);
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-500 text-white text-xs">Active</Badge>
    ) : (
      <Badge className="bg-gray-500 text-white text-xs">Inactive</Badge>
    );
  };

  const getResponseStats = (responses: FormResponseLite[]) => {
    const stats = {
      total: responses.length,
      submitted: responses.filter((r) => r.status === "submitted").length,
      underReview: responses.filter((r) => r.status === "under_review").length,
      approved: responses.filter((r) => r.status === "approved").length,
      rejected: responses.filter((r) => r.status === "rejected").length,
    };
    return stats;
  };

  const overviewStats = useMemo(() => {
    const now = new Date();
    return {
      totalBriefs: forms.length,
      activeBriefs: forms.filter((form: FormListItem) => form.is_active).length,
      totalResponses: forms.reduce(
        (total: number, form: FormListItem) =>
          total + (form.application_form_responses?.length || 0),
        0
      ),
      createdThisMonth: forms.filter((form: FormListItem) => {
        const formDate = new Date(form.created_at);
        return (
          formDate.getMonth() === now.getMonth() &&
          formDate.getFullYear() === now.getFullYear()
        );
      }).length,
    };
  }, [forms]);

  return (
    <div className="space-y-6 animate-blur-in">
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
          onClick={() => router.push("/admin/forms/create")}
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
                  {overviewStats.totalBriefs}
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
                  {overviewStats.activeBriefs}
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
                  {overviewStats.totalResponses}
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
                  {overviewStats.createdThisMonth}
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
            <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
          </div>
          </div>
        ) : loadError ? (
          <Card className="bg-card border-border">
            <CardContent className="p-6 space-y-3 text-center">
              <p className={textStyles.body.regular}>Couldn&apos;t load briefs.</p>
              <Button variant="outline" onClick={fetchForms}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : forms.length === 0 ? (
          <div className="text-center py-8">
            <p className={textStyles.body.regular}>
              No briefs found. Create your first application brief!
            </p>
          </div>
        ) : (
          forms.map((form: FormListItem) => {
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
                        {form.description || "No description"}
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
                        {responseStats.underReview > 0 && (
                          <Badge variant="outline" className="text-xs text-amber-500">
                            {responseStats.underReview} under review
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
                          onClick={() => router.push(`/admin/forms/${form.id}/responses`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Responses
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-foreground"
                          onClick={() => router.push(`/admin/forms/${form.id}/edit`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-foreground"
                          onClick={() => router.push(`/admin/forms/${form.id}/duplicate`)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicate
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem
                              onClick={() => handleDelete(form.id, form.title)}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className={`${textStyles.subheading.large} text-brand-white`}>
              Delete Brief
            </DialogTitle>
            <DialogDescription className={textStyles.body.regular}>
              Are you sure you want to delete &quot;{formToDelete?.title}&quot;? This action cannot be undone.
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
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
