"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  getCurrentUserProfile,
  getCurrentUserId,
  type UserProfile,
} from "@/lib/auth-utils";
import { textStyles } from "@/lib/typography";
import { formatDateShort } from "@/lib/date-utils";
import {
  listFeedback,
  submitFeedback,
  updateFeedbackStatus,
  TYPE_OPTIONS,
  SEVERITY_OPTIONS,
  STATUS_OPTIONS,
  type FeedbackItem,
  type FeedbackSeverity,
  type FeedbackStatus,
  type FeedbackType,
} from "@/lib/feedback/service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Send,
  Bug,
  AlertCircle,
  Clock,
  HelpCircle,
  ExternalLink,
  User,
} from "lucide-react";

export default function FeedbackPage() {
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [formData, setFormData] = useState({
    issue_title: "",
    type: "bug" as FeedbackType,
    severity: "annoying" as FeedbackSeverity,
    where_it_happens: "",
    steps_to_reproduce: "",
    screenshot_link: "",
  });

  const isAdmin = userProfile?.role === "admin";

  useEffect(() => {
    const load = async () => {
      const profile = await getCurrentUserProfile();
      const id = await getCurrentUserId();
      setUserProfile(profile);
      setUserId(id);
      setAuthLoaded(true);
    };
    load();
  }, []);

  const updateForm = useCallback(
    <K extends keyof typeof formData>(key: K, value: (typeof formData)[K]) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const fetchFeedback = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const result = await listFeedback({ isAdmin, userId });
      if (!result.ok) {
        throw new Error(result.message);
      }
      setFeedbackList(result.items);
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to load feedback",
        variant: "destructive",
      });
      setFeedbackList([]);
    } finally {
      setIsLoadingList(false);
    }
  }, [isAdmin, userId, toast]);

  useEffect(() => {
    if (authLoaded) {
      fetchFeedback();
    }
  }, [authLoaded, userId, isAdmin, fetchFeedback]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be signed in to submit feedback",
        variant: "destructive",
      });
      return;
    }

    if (!formData.issue_title.trim()) {
      toast({
        title: "Error",
        description: "Please enter an issue title",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitFeedback({
        userId,
        issue_title: formData.issue_title,
        type: formData.type,
        severity: formData.severity,
        where_it_happens: formData.where_it_happens,
        steps_to_reproduce: formData.steps_to_reproduce,
        screenshot_link: formData.screenshot_link,
      });
      if (!result.ok) {
        throw new Error(result.message);
      }

      toast({
        title: "Feedback submitted",
        description: "Thanks! Your bug or friction note has been logged.",
      });

      setFormData({
        issue_title: "",
        type: "bug",
        severity: "annoying",
        where_it_happens: "",
        steps_to_reproduce: "",
        screenshot_link: "",
      });

      fetchFeedback();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: FeedbackStatus) => {
    try {
      setUpdatingId(id);
      const result = await updateFeedbackStatus({ id, status });
      if (!result.ok) throw new Error(result.message);
      toast({ title: "Status updated" });
      setFeedbackList((prev: FeedbackItem[]) =>
        prev.map((item: FeedbackItem) =>
          item.id === id ? { ...item, status } : item
        )
      );
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update status",
        variant: "destructive",
      });
      fetchFeedback();
    } finally {
      setUpdatingId(null);
    }
  };

  const getTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case "bug":
        return <Bug className="h-4 w-4" />;
      case "confusing":
      case "unclear":
        return <HelpCircle className="h-4 w-4" />;
      case "slow":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: FeedbackSeverity) => {
    const map = {
      stopper: "bg-red-500/20 text-red-400 border-red-500/50",
      annoying: "bg-amber-500/20 text-amber-400 border-amber-500/50",
      minor: "bg-muted text-muted-foreground border-border",
    };
    return <Badge variant="outline" className={map[severity]}>{severity}</Badge>;
  };

  const getStatusBadge = (status: FeedbackStatus) => {
    const map = {
      to_do: "bg-muted text-muted-foreground",
      in_progress: "bg-brand-green/20 text-brand-green border-brand-green/50",
      done: "bg-green-500/20 text-green-400 border-green-500/50",
    };
    return <Badge className={map[status]}>{STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status}</Badge>;
  };

  return (
    <div className="space-y-6 animate-blur-in">
      <div>
        <h1 className="font-ts-block ts-xl uppercase text-left text-brand-green text-lg sm:text-xl md:text-2xl">
          Bug + Friction Log
        </h1>
        <p className={`${textStyles.body.regular} text-sm sm:text-base`}>
          Log issues here so nothing gets lost. One place for bugs and friction.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submit form */}
        <Card className="lg:col-span-1 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Submit feedback
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Issue title, type, severity, where it happens, steps, and optional screenshot link.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="issue_title">Issue title</Label>
                <Input
                  id="issue_title"
                  value={formData.issue_title}
                  onChange={(e) => updateForm("issue_title", e.target.value)}
                  placeholder="Short, clear title"
                  className="bg-secondary border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => updateForm("type", v as FeedbackType)}
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(v) =>
                    updateForm("severity", v as FeedbackSeverity)
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEVERITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="where">Where it happens (screen/flow)</Label>
                <Input
                  id="where"
                  value={formData.where_it_happens}
                  onChange={(e) =>
                    updateForm("where_it_happens", e.target.value)
                  }
                  placeholder="e.g. Dashboard, Booking flow"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="steps">Steps to reproduce</Label>
                <Textarea
                  id="steps"
                  value={formData.steps_to_reproduce}
                  onChange={(e) =>
                    updateForm("steps_to_reproduce", e.target.value)
                  }
                  placeholder="1. Go to... 2. Click..."
                  rows={3}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="screenshot">Screenshot / screen recording link</Label>
                <Input
                  id="screenshot"
                  type="url"
                  value={formData.screenshot_link}
                  onChange={(e) => updateForm("screenshot_link", e.target.value)}
                  placeholder="https://..."
                  className="bg-secondary border-border"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-brand-green text-brand-black hover:bg-brand-green/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-black border-t-transparent" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Submit feedback
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Log */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {isAdmin ? "All feedback" : "Your feedback"}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Owner + status for each item. Update status from the list."
                : "Your submitted issues and their status."}
            </p>
          </CardHeader>
          <CardContent>
            {isLoadingList ? (
              <div className="mx-auto w-full max-w-md space-y-3 py-4">
                <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
                <div className="h-20 w-full animate-pulse rounded-md bg-muted/70" />
                <div className="h-20 w-full animate-pulse rounded-md bg-muted/50" />
              </div>
            ) : feedbackList.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">
                No feedback logged yet. Submit one above.
              </div>
            ) : (
              <div className="space-y-4">
                {feedbackList.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-border bg-secondary/30 space-y-2"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getTypeIcon(item.type)}
                        <span className="font-medium text-foreground">
                          {item.issue_title}
                        </span>
                        {getSeverityBadge(item.severity)}
                      </div>
                      {isAdmin && (
                        <Select
                          value={item.status}
                          onValueChange={(v) =>
                            handleStatusChange(item.id, v as FeedbackStatus)
                          }
                          disabled={updatingId === item.id}
                        >
                          <SelectTrigger className="w-[140px] bg-background border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {!isAdmin && getStatusBadge(item.status)}
                    </div>
                    {item.where_it_happens && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Where:</span>{" "}
                        {item.where_it_happens}
                      </p>
                    )}
                    {item.steps_to_reproduce && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        <span className="font-medium">Steps:</span>{" "}
                        {item.steps_to_reproduce}
                      </p>
                    )}
                    {item.screenshot_link && (
                      <a
                        href={item.screenshot_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-green hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Screenshot / recording
                      </a>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                      {item.submitter && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.submitter.first_name} {item.submitter.last_name}
                          {item.submitter.email ? ` (${item.submitter.email})` : ""}
                        </span>
                      )}
                      {isAdmin && item.owner && (
                        <span className="flex items-center gap-1">
                          Owner: {item.owner.first_name} {item.owner.last_name}
                        </span>
                      )}
                      <span>{formatDateShort(item.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
