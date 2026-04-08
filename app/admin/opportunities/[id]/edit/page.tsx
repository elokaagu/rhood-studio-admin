"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RhoodDatePicker, RhoodTimePicker } from "@/components/ui/rhood-pickers";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserProfile, getCurrentUserId } from "@/lib/auth-utils";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Calendar,
  MapPin,
  Music,
  Save,
  ArrowLeft,
  Clock,
  Link as LinkIcon,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import LocationAutocomplete from "@/components/location-autocomplete";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDisplayLength } from "@/lib/text-utils";
import {
  OPPORTUNITY_DESCRIPTION_MAX_LENGTH,
  buildOpportunityUpdatePayload,
  opportunityRowToFormState,
  processOpportunityDescription,
  saveOpportunity,
  validateOpportunityForm,
  type OpportunityFormState,
} from "@/lib/admin/opportunities/opportunity-edit";

export default function EditOpportunityPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const opportunityId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [aiRefineDialogOpen, setAiRefineDialogOpen] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState<OpportunityFormState>({
    title: "",
    description: "",
    location: "",
    locationPlaceId: "",
    dateType: "single",
    date: "",
    endDate: "",
    time: "",
    endTime: "",
    pay: "",
    genre: "",
    requirements: "",
    additionalInfo: "",
    status: "draft",
    imageUrl: "",
    archived: false,
  });

  const fetchOpportunity = async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      const userProfile = await getCurrentUserProfile();
      const userId = await getCurrentUserId();

      let query = supabase
        .from("opportunities")
        .select("*")
        .eq("id", opportunityId);

      if (userProfile?.role === "brand" && userId) {
        query = query.eq("organizer_id", userId);
      }

      const { data, error } = await query.single();

      if (error) {
        throw error;
      }

      if (
        userProfile?.role === "brand" &&
        userId &&
        data &&
        data.organizer_id !== userId
      ) {
        toast({
          title: "Access Denied",
          description: "You can only edit your own opportunities.",
          variant: "destructive",
        });
        router.push("/admin/opportunities");
        return;
      }

      if (data) {
        setFormData(opportunityRowToFormState(data));
      }
    } catch (error) {
      console.error("Error fetching opportunity:", error);
      const message =
        error instanceof Error ? error.message : "Failed to load opportunity.";
      setLoadError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunity();
  }, [opportunityId]); // eslint-disable-line react-hooks/exhaustive-deps

  const genres = [
    "House",
    "Techno",
    "Drum & Bass",
    "Dubstep",
    "Trap",
    "Hip-Hop",
    "Electronic",
    "Progressive",
    "Trance",
    "Ambient",
    "Breakbeat",
  ];

  const persistOpportunity = async (mode: "publish" | "draft") => {
    setIsSubmitting(true);
    try {
      const validated = validateOpportunityForm(formData);
      if (!validated.ok) {
        toast({
          title: "Check your entries",
          description: validated.message,
          variant: "destructive",
        });
        return;
      }

      const processedDescription = processOpportunityDescription(
        formData.description
      );

      const payload = buildOpportunityUpdatePayload(
        formData,
        validated,
        mode,
        processedDescription
      );

      const saveResult = await saveOpportunity(opportunityId, payload);
      if (!saveResult.ok) {
        throw new Error(saveResult.message);
      }

      toast({
        title: mode === "publish" ? "Success" : "Draft Saved",
        description:
          mode === "publish"
            ? "Opportunity updated successfully!"
            : "Opportunity saved as draft successfully!",
      });

      router.push(`/admin/opportunities/${opportunityId}`);
    } catch (error) {
      console.error("Error saving opportunity:", error);
      toast({
        title: "Error",
        description:
          mode === "publish"
            ? "Failed to update opportunity. Please try again."
            : "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await persistOpportunity("publish");
  };

  const handleSaveDraft = async () => {
    await persistOpportunity("draft");
  };

  const handleOpenLinkDialog = () => {
    const textarea = descriptionTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = formData.description.substring(start, end);
      setLinkText(selectedText || "");
    }
    setLinkDialogOpen(true);
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive",
      });
      return;
    }

    const textarea = descriptionTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = formData.description.substring(0, start);
    const textAfter = formData.description.substring(end);
    const linkMarkdown = `[${linkText.trim() || linkUrl}](${linkUrl.trim()})`;
    const newDescription = textBefore + linkMarkdown + textAfter;

    // Check display length (excluding markdown syntax) instead of raw length
    const displayLength = getDisplayLength(newDescription);
    if (displayLength > OPPORTUNITY_DESCRIPTION_MAX_LENGTH) {
      toast({
        title: "Error",
        description: `Link would exceed the ${OPPORTUNITY_DESCRIPTION_MAX_LENGTH} character limit`,
        variant: "destructive",
      });
      return;
    }

    setFormData({ ...formData, description: newDescription });
    setLinkDialogOpen(false);
    setLinkUrl("");
    setLinkText("");

    // Restore cursor position after link
    setTimeout(() => {
      const newPosition = start + linkMarkdown.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  const handleRefineWithAI = async () => {
    if (!formData.description.trim()) {
      toast({
        title: "No text to refine",
        description: "Please enter some text in the description field first.",
        variant: "destructive",
      });
      return;
    }

    setIsRefining(true);
    try {
      const response = await fetch("/api/ai/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: formData.description,
          maxLength: OPPORTUNITY_DESCRIPTION_MAX_LENGTH,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to refine text");
      }

      const data = await response.json();
      const refinedText = data.refinedText || formData.description;

      // Check display length before applying
      if (getDisplayLength(refinedText) > OPPORTUNITY_DESCRIPTION_MAX_LENGTH) {
        toast({
          title: "Refinement too long",
          description: `The refined text exceeds the ${OPPORTUNITY_DESCRIPTION_MAX_LENGTH} character limit.`,
          variant: "destructive",
        });
        return;
      }

      setFormData({ ...formData, description: refinedText });
      setAiRefineDialogOpen(false);
      toast({
        title: "Text refined",
        description: "Your description has been refined by AI.",
      });

      // Focus the textarea after refinement
      setTimeout(() => {
        descriptionTextareaRef.current?.focus();
      }, 0);
    } catch (error) {
      console.error("Error refining text:", error);
      toast({
        title: "Refinement failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to refine text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefining(false);
    }
  };

  // Handle Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        const activeElement = document.activeElement;
        if (
          activeElement === descriptionTextareaRef.current ||
          activeElement?.id === "description"
        ) {
          e.preventDefault();
          handleOpenLinkDialog();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  if (loadError) {
    return (
      <div className="space-y-6 max-w-lg mx-auto text-center">
        <h1 className={textStyles.headline.section}>Could not load opportunity</h1>
        <p className={`${textStyles.body.regular} text-muted-foreground`}>
          {loadError}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => fetchOpportunity()}>
            Retry
          </Button>
          <Button onClick={() => router.push("/admin/opportunities")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to opportunities
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-blur-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/opportunities/${opportunityId}`)}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className={`${textStyles.headline.section} text-lg sm:text-xl md:text-2xl`}>EDIT OPPORTUNITY</h1>
            <p className={`${textStyles.body.regular} text-sm sm:text-base`}>
              Update opportunity information
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Basic Information */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className={textStyles.subheading.small}>
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className={textStyles.body.regular}>
                Opportunity Title
              </Label>
              <Input
                id="title"
                placeholder="e.g., Underground Warehouse Rave"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="bg-secondary border-border text-foreground"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className={textStyles.body.regular}>
                  Description
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAiRefineDialogOpen(true)}
                    className="h-8 px-2"
                    title="Refine with AI"
                    disabled={!formData.description.trim()}
                  >
                    <Sparkles className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenLinkDialog}
                    className="h-8 px-2"
                    title="Insert link (Ctrl+K / Cmd+K)"
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Textarea
                ref={descriptionTextareaRef}
                id="description"
                placeholder="Describe the event, atmosphere, and what you're looking for..."
                value={formData.description}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Only update if display length is within limit
                  if (getDisplayLength(newValue) <= OPPORTUNITY_DESCRIPTION_MAX_LENGTH) {
                    setFormData({ ...formData, description: newValue });
                  }
                }}
                className="bg-secondary border-border text-foreground min-h-[100px]"
                required
              />
              <p className="text-xs text-muted-foreground text-right">
                {getDisplayLength(formData.description)}/{OPPORTUNITY_DESCRIPTION_MAX_LENGTH} characters
              </p>
            </div>

            <ImageUpload
              label="Event Image"
              value={formData.imageUrl}
              onChange={(url) => setFormData({ ...formData, imageUrl: url || "" })}
              required={false}
              maxSize={5}
              acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
              bucketName="opportunities"
              folder="images"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location" className={`${textStyles.body.regular} flex items-center`}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Location
                </Label>
              <LocationAutocomplete
                  id="location"
                placeholder="Search for a venue or address"
                  value={formData.location}
                onValueChange={(locationValue) =>
                  setFormData((previous) => ({
                    ...previous,
                    location: locationValue,
                    locationPlaceId: "",
                  }))
                }
                onLocationSelect={(selection) =>
                  setFormData((previous) => ({
                    ...previous,
                    location: selection.formattedAddress ?? selection.description,
                    locationPlaceId: selection.placeId,
                  }))
                }
                className="bg-secondary border-border text-foreground"
                country="gb"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pay" className={`${textStyles.body.regular} flex items-center`}>
                  Pay Range
                </Label>
                <Input
                  id="pay"
                  placeholder="e.g., £200-400"
                  value={formData.pay}
                  onChange={(e) =>
                    setFormData({ ...formData, pay: e.target.value })
                  }
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className={textStyles.subheading.small}>
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dateType" className={textStyles.body.regular}>
                Campaign Type
              </Label>
              <Select
                value={formData.dateType}
                onValueChange={(value: "single" | "range") =>
                  setFormData({ ...formData, dateType: value, endDate: "" })
                }
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem
                    value="single"
                    className="text-foreground hover:bg-accent"
                  >
                    Single Date Event
                  </SelectItem>
                  <SelectItem
                    value="range"
                    className="text-foreground hover:bg-accent"
                  >
                    Date Range Campaign
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="date"
                    className={`${textStyles.body.regular} flex items-center`}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {formData.dateType === "range" ? "Start Date" : "Date"}
                  </Label>
                  <RhoodDatePicker
                    value={formData.date}
                    onChange={(value) =>
                      setFormData({ ...formData, date: value })
                    }
                  />
                </div>

                {formData.dateType === "range" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="endDate"
                      className={`${textStyles.body.regular} flex items-center`}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      End Date
                    </Label>
                    <RhoodDatePicker
                      value={formData.endDate}
                      onChange={(value) =>
                        setFormData({ ...formData, endDate: value })
                      }
                      min={formData.date}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="time"
                    className={`${textStyles.body.regular} flex items-center`}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Start Time
                  </Label>
                  <RhoodTimePicker
                    value={formData.time}
                    onChange={(value) =>
                      setFormData({ ...formData, time: value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="endTime"
                    className={`${textStyles.body.regular} flex items-center`}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Finish Time
                  </Label>
                  <RhoodTimePicker
                    value={formData.endTime}
                    onChange={(value) =>
                      setFormData({ ...formData, endTime: value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="genre" className={textStyles.body.regular}>
                <Music className="h-4 w-4 mr-2" />
                Genre
              </Label>
              <Select
                value={formData.genre}
                onValueChange={(value) =>
                  setFormData({ ...formData, genre: value })
                }
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {genres.map((genre) => (
                    <SelectItem
                      key={genre}
                      value={genre}
                      className="text-foreground hover:bg-accent"
                    >
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className={textStyles.subheading.small}>
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requirements" className={textStyles.body.regular}>
                Requirements
              </Label>
              <Textarea
                id="requirements"
                placeholder="Equipment needed, experience level, etc."
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
                className="bg-secondary border-border text-foreground min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="additionalInfo"
                className={textStyles.body.regular}
              >
                Additional Information
              </Label>
              <Textarea
                id="additionalInfo"
                placeholder="Any other details, contact information, etc."
                value={formData.additionalInfo}
                onChange={(e) =>
                  setFormData({ ...formData, additionalInfo: e.target.value })
                }
                className="bg-secondary border-border text-foreground min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className={textStyles.body.regular}>
                Status
              </Label>
              <p className="text-xs text-muted-foreground">
                Saved as <code className="text-xs">listing_status</code>. “Active”
                also sets <code className="text-xs">is_active</code> for the app when
                not archived.
              </p>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem
                    value="draft"
                    className="text-foreground hover:bg-accent"
                  >
                    Draft
                  </SelectItem>
                  <SelectItem
                    value="active"
                    className="text-foreground hover:bg-accent"
                  >
                    Active
                  </SelectItem>
                  <SelectItem
                    value="closed"
                    className="text-foreground hover:bg-accent"
                  >
                    Closed
                  </SelectItem>
                  <SelectItem
                    value="completed"
                    className="text-foreground hover:bg-accent"
                  >
                    Completed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start justify-between border border-border rounded-lg p-4 bg-secondary/30">
              <div className="space-y-1">
                <p className={textStyles.body.regular}>Archive opportunity</p>
                <p className="text-sm text-muted-foreground">
                  Archived opportunities stay visible in the Portal but are
                  removed from the app.
                </p>
              </div>
              <Switch
                checked={formData.archived}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, archived: checked })
                }
                aria-label="Toggle archive status"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 sm:space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            type="submit"
            className="bg-brand-green hover:bg-brand-green/90 text-brand-black"
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Updating..." : "Update Opportunity"}
          </Button>
        </div>
      </form>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogDescription>
              Add a link to your description. Selected text will be used as the
              link text.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-text">Link Text</Label>
              <Input
                id="link-text"
                placeholder="Text to display (optional)"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url">URL *</Label>
              <Input
                id="link-url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="bg-secondary border-border text-foreground"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleInsertLink();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLinkDialogOpen(false);
                setLinkUrl("");
                setLinkText("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInsertLink}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Insert Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Refinement Dialog */}
      <Dialog open={aiRefineDialogOpen} onOpenChange={setAiRefineDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Refine with AI
            </DialogTitle>
            <DialogDescription>
              AI will refine your description to be clearer and more concise
              while preserving all key information. The text will stay within
              the {OPPORTUNITY_DESCRIPTION_MAX_LENGTH} character limit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Description</Label>
              <div className="p-3 bg-secondary border border-border rounded-md text-sm text-muted-foreground max-h-32 overflow-y-auto">
                {formData.description || "(empty)"}
              </div>
              <p className="text-xs text-muted-foreground">
                {getDisplayLength(formData.description)}/{OPPORTUNITY_DESCRIPTION_MAX_LENGTH} characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAiRefineDialogOpen(false)}
              disabled={isRefining}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefineWithAI}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isRefining || !formData.description.trim()}
            >
              {isRefining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refining...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Refine Text
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
