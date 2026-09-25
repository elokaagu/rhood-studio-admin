"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";
import { RhoodDatePicker, RhoodTimePicker } from "@/components/ui/rhood-pickers";
import { TimezoneSelect } from "@/components/admin/TimezoneSelect";
import { DjApprovalsField } from "@/components/admin/DjApprovalsField";
import { OrderValueField } from "@/components/admin/OrderValueField";
import { orderValuePatchForCompensation } from "@/lib/opportunities/order-value";
import { resolveTimeZone } from "@/lib/opportunities/timezones";
import type { ApprovalLimitMode } from "@/lib/opportunities/approval-limit";
import {
  createOpportunity,
  OPPORTUNITY_DESCRIPTION_MAX_LENGTH,
  type OpportunityCreateMode,
} from "@/lib/opportunities/create-opportunity";
import {
  Calendar,
  MapPin,
  Music,
  Save,
  X,
  Plus,
  Clock,
  Link as LinkIcon,
  Sparkles,
  Loader2,
  Building2,
  Globe,
} from "lucide-react";
import LocationAutocomplete from "@/components/location-autocomplete";
import { GoogleMapsLink } from "@/components/google-maps-link";
import { GenrePicker } from "@/components/admin/GenrePicker";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDisplayLength, clipBriefToLimit } from "@/lib/text-utils";
import { getCurrentUserProfile } from "@/lib/auth-utils";
import { checkCanPublishOpportunity } from "@/lib/brand/subscription";
import { fetchBrandList, type BrandListItem } from "@/lib/brands/fetch-brand-list";
import { listingStatusLabel } from "@/lib/opportunities/listing-status";
import {
  AutosaveStatusText,
  useAutosaveDraft,
} from "@/hooks/use-autosave-draft";

export default function CreateOpportunityPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [brands, setBrands] = useState<BrandListItem[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("none");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [aiRefineDialogOpen, setAiRefineDialogOpen] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    locationPlaceId: "",
    dateType: "single" as "single" | "range",
    date: "",
    endDate: "",
    time: "",
    endTime: "",
    pay: "",
    genre: "",
    requirements: "",
    additionalInfo: "",
    status: "pending",
    imageUrl: "",
    noEndDate: false,
    website: "",
    timezone: resolveTimeZone(),
    approvalLimit: "unlimited" as ApprovalLimitMode,
    approvalLimitCount: 2,
    orderValue: "",
    orderCurrency: "GBP",
    orderFxRate: 1 as number | null,
    orderFxDate: null as string | null,
  });

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const draftSnapshot = useMemo(
    () => ({ formData, selectedGenres, selectedBrandId }),
    [formData, selectedGenres, selectedBrandId]
  );
  const { status: autosaveStatus, clear: clearDraft } = useAutosaveDraft({
    storageKey: "rhood-studio-draft:opportunity-create",
    value: draftSnapshot,
    onRestore: (draft) => {
      if (draft.formData) {
        setFormData({
          ...draft.formData,
          timezone: draft.formData.timezone || resolveTimeZone(),
          approvalLimit: draft.formData.approvalLimit || "unlimited",
          approvalLimitCount: draft.formData.approvalLimitCount || 2,
          orderValue: draft.formData.orderValue || "",
          orderCurrency: draft.formData.orderCurrency || "GBP",
          orderFxRate: draft.formData.orderFxRate ?? 1,
          orderFxDate: draft.formData.orderFxDate ?? null,
        });
      }
      if (Array.isArray(draft.selectedGenres)) {
        setSelectedGenres(draft.selectedGenres);
      }
      if (typeof draft.selectedBrandId === "string") {
        setSelectedBrandId(draft.selectedBrandId);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreateOrDraft("publish");
  };

  const handleSaveDraft = async () => {
    await handleCreateOrDraft("draft");
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
          context: {
            title: formData.title,
            location: formData.location,
            compensation: formData.pay,
            genres: selectedGenres,
            dateType: formData.dateType,
            date: formData.date,
            endDate: formData.endDate,
            time: formData.time,
            endTime: formData.endTime,
            requirements: formData.requirements,
            website: formData.website,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to refine text");
      }

      const data = await response.json();
      let refinedText = clipBriefToLimit(
        data.refinedText || formData.description,
        OPPORTUNITY_DESCRIPTION_MAX_LENGTH
      );
      while (
        getDisplayLength(refinedText) > OPPORTUNITY_DESCRIPTION_MAX_LENGTH &&
        refinedText.length > 0
      ) {
        refinedText = clipBriefToLimit(refinedText, refinedText.length - 1);
      }

      setFormData({ ...formData, description: refinedText });
      setAiRefineDialogOpen(false);
      toast({
        title: "Brief expanded",
        description: "AI added context so DJs get a clearer, more standardised brief.",
      });

      // Focus the textarea after refinement
      setTimeout(() => {
        descriptionTextareaRef.current?.focus();
      }, 0);
    } catch (error) {
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

  // Load brand list for admins so they can post on behalf of a brand
  useEffect(() => {
    getCurrentUserProfile().then((profile) => {
      if (profile?.role === "admin") {
        setIsAdmin(true);
        fetchBrandList().then(setBrands);
      }
    });
  }, []);

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

  const handleCreateOrDraft = async (mode: OpportunityCreateMode) => {
    setIsSubmitting(true);
    try {
      const brandOverride =
        isAdmin && selectedBrandId !== "none"
          ? brands.find((b) => b.id === selectedBrandId) ?? null
          : null;

      const result = await createOpportunity({
        form: formData,
        selectedGenres,
        mode,
        brandOverride,
      });

      if (!result.ok) {
        toast({
          title: result.toastTitle,
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      clearDraft();
      toast({
        title: mode === "publish" ? "Success" : "Draft Saved",
        description:
          mode === "publish"
            ? formData.status === "active"
              ? "Your opportunity is live in the app."
              : formData.status === "pending"
                ? "Your opportunity is in review."
                : "Opportunity created successfully!"
            : "Opportunity saved as draft successfully!",
      });
      if (result.warning) {
        toast({
          title: "Order value not saved",
          description: result.warning,
          variant: "destructive",
        });
      }

      router.push(`/admin/opportunities/${result.opportunity.id}`);
    } catch {
      toast({
        title: "Opportunity Not Saved",
        description:
          "Failed to save the opportunity. Please review the form and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Create Opportunity
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Post a new DJ opportunity</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/opportunities")}
          className="w-full sm:w-auto"
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Admin: post on behalf of a brand */}
        {isAdmin && brands.length > 0 && (
          <Card className="bg-card border-brand-green/30 border">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-brand-green" />
                Post on behalf of a brand
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label className="text-foreground text-sm">Brand account</Label>
                <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                  <SelectTrigger className="bg-secondary border-border text-foreground">
                    <SelectValue placeholder="Select a brand (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="none" className="text-foreground hover:bg-accent">
                      — Post as admin (no brand) —
                    </SelectItem>
                    {brands.map((brand) => (
                      <SelectItem
                        key={brand.id}
                        value={brand.id}
                        className="text-foreground hover:bg-accent"
                      >
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedBrandId !== "none" && (
                  <p className="text-xs text-brand-green">
                    This opportunity will be attributed to{" "}
                    <strong>{brands.find((b) => b.id === selectedBrandId)?.name}</strong> and will appear
                    under their brand account.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Basic Information */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-foreground">
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
                <Label htmlFor="description" className="text-foreground">
                  Description
                </Label>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAiRefineDialogOpen(true)}
                        className="h-8 px-2 text-brand-green hover:text-brand-green"
                        disabled={!formData.description.trim()}
                        aria-label="Expand into a brief with AI"
                      >
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Expand into a brief</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleOpenLinkDialog}
                        className="h-8 px-2"
                        aria-label="Insert link"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Insert link (Ctrl+K / Cmd+K)</TooltipContent>
                  </Tooltip>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <ImageUpload
                label="Event Image"
                value={formData.imageUrl}
                onChange={(url) =>
                  setFormData({ ...formData, imageUrl: url || "" })
                }
                required={false}
                maxSize={5}
                acceptedFormats={["image/jpeg", "image/png", "image/webp"]}
                bucketName="opportunities"
                folder="images"
                aspect="square"
                className="w-full"
              />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="location"
                    className="text-foreground flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Location
                    </span>
                    <GoogleMapsLink
                      address={formData.location}
                      placeId={formData.locationPlaceId}
                      className="text-xs"
                    >
                      Open in Maps
                    </GoogleMapsLink>
                  </Label>
                  <LocationAutocomplete
                    id="location"
                    placeholder="Search for a venue, address, or Online"
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
                        location:
                          selection.formattedAddress ?? selection.description,
                        locationPlaceId: selection.placeId,
                      }))
                    }
                    className="bg-secondary border-border text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pay" className="text-foreground flex items-center">
                    Compensation
                  </Label>
                  <Input
                    id="pay"
                    placeholder="e.g. Free, 0, £200, or drinks + travel"
                    value={formData.pay}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ...orderValuePatchForCompensation(formData, e.target.value),
                        pay: e.target.value,
                      })
                    }
                    className="bg-secondary border-border text-foreground"
                  />
                </div>

                <OrderValueField
                  value={formData}
                  onChange={(patch) =>
                    setFormData((previous) => ({ ...previous, ...patch }))
                  }
                />

                <div className="space-y-2">
                  <Label
                    htmlFor="website"
                    className="text-foreground flex items-center"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Website (optional)
                  </Label>
                  <Input
                    id="website"
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="https://your-event.com"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Details */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dateType" className="text-foreground">
                Campaign Type
              </Label>
              <Select
                value={formData.dateType}
                onValueChange={(value: "single" | "range") =>
                  setFormData({
                    ...formData,
                    dateType: value,
                    endDate: "",
                    noEndDate: false,
                  })
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
                    Multi Date Campaign
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="date"
                    className="text-foreground flex items-center"
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

                {formData.dateType === "range" && !formData.noEndDate && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="endDate"
                      className="text-foreground flex items-center"
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

              {formData.dateType === "range" && (
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <Checkbox
                    checked={formData.noEndDate}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        noEndDate: checked === true,
                        endDate: checked === true ? "" : formData.endDate,
                        endTime: checked === true ? "" : formData.endTime,
                      })
                    }
                  />
                  No end date — ongoing campaign
                </label>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="time"
                    className="text-foreground flex items-center"
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

                {!formData.noEndDate && (
                <div className="space-y-2">
                  <Label
                    htmlFor="endTime"
                    className="text-foreground flex items-center"
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
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="timezone"
                  className="text-foreground flex items-center"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Timezone
                </Label>
                <TimezoneSelect
                  value={formData.timezone}
                  onChange={(timezone) =>
                    setFormData({ ...formData, timezone })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Start and finish times are kept in this timezone, so 00:00
                  stays 00:00 wherever the listing is viewed.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground flex items-center">
                <Music className="h-4 w-4 mr-2" />
                Genres
              </Label>
              <GenrePicker value={selectedGenres} onChange={setSelectedGenres} />
            </div>

            <DjApprovalsField
              mode={formData.approvalLimit}
              count={formData.approvalLimitCount}
              onModeChange={(approvalLimit) =>
                setFormData({ ...formData, approvalLimit })
              }
              onCountChange={(approvalLimitCount) =>
                setFormData({ ...formData, approvalLimitCount })
              }
            />
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requirements" className="text-foreground">
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
              <Label htmlFor="additionalInfo" className="text-foreground">
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
              <Label htmlFor="status" className="text-foreground">
                Status
              </Label>
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
                    value="pending"
                    className="text-foreground hover:bg-accent"
                  >
                    {listingStatusLabel("pending")}
                  </SelectItem>
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
                    {listingStatusLabel("active")}
                  </SelectItem>
                  <SelectItem
                    value="closed"
                    className="text-foreground hover:bg-accent"
                  >
                    Closed
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 sm:space-x-4">
          <AutosaveStatusText status={autosaveStatus} />
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
            className="bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isSubmitting
              ? "Saving..."
              : formData.status === "active" || formData.status === "pending"
                ? listingStatusLabel(formData.status)
                : "Create Opportunity"}
          </Button>
        </div>
      </form>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
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
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Expand into a brief
            </DialogTitle>
            <DialogDescription>
              AI will add context around your notes to build a standardised DJ
              brief — what the gig is, who it is for, and the vibe. It stays
              within {OPPORTUNITY_DESCRIPTION_MAX_LENGTH} characters.
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
                  Expand brief
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
