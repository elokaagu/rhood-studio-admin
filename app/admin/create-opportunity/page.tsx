"use client";

import React, { useState, useRef, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/ui/image-upload";
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
} from "lucide-react";
import LocationAutocomplete from "@/components/location-autocomplete";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDisplayLength, getDisplayText } from "@/lib/text-utils";

const DESCRIPTION_MAX_LENGTH = 700;

export default function CreateOpportunityPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [aiRefineDialogOpen, setAiRefineDialogOpen] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [briefPreviewOpen, setBriefPreviewOpen] = useState(false);
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
    status: "draft",
    imageUrl: "",
    // Brief questionnaire fields (required for structured briefs)
    briefConcept: "",
    briefEventDetails: "",
    briefRequirements: "",
    briefBrandIntegration: "",
    briefWhyThisOpportunity: "",
    briefDeliverables: "",
    briefCompensation: "",
    // Short summary (public, shown before applying)
    shortSummary: "",
  });

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

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

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCreateOrDraft({ publishImmediately: true });
  };

  const handleSaveDraft = async () => {
    await handleCreateOrDraft({ publishImmediately: false });
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
    if (displayLength > DESCRIPTION_MAX_LENGTH) {
      toast({
        title: "Error",
        description: `Link would exceed the ${DESCRIPTION_MAX_LENGTH} character limit`,
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
          maxLength: DESCRIPTION_MAX_LENGTH,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to refine text");
      }

      const data = await response.json();
      const refinedText = data.refinedText || formData.description;

      // Check display length before applying
      if (getDisplayLength(refinedText) > DESCRIPTION_MAX_LENGTH) {
        toast({
          title: "Refinement too long",
          description: `The refined text exceeds the ${DESCRIPTION_MAX_LENGTH} character limit.`,
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

  // Generate formatted brief from questionnaire answers using R/HOOD template
  // Designed for gigs, brand sponsorships, and opportunities
  const generateBrief = () => {
    const sections = [];
    
    // Concept proposal / The idea
    if (formData.briefConcept) {
      sections.push(`**Concept proposal: ${formData.title || 'OPPORTUNITY'}\n\n**The idea**\n\n${formData.briefConcept}`);
    }
    
    // Event/Gig Details
    if (formData.briefEventDetails) {
      sections.push(`**Event details**\n\n${formData.briefEventDetails}`);
    }
    
    // Requirements & Expectations
    if (formData.briefRequirements) {
      sections.push(`**Requirements & expectations**\n\n${formData.briefRequirements}`);
    }
    
    // Brand Integration
    if (formData.briefBrandIntegration) {
      sections.push(`**Brand integration**\n\n${formData.briefBrandIntegration}`);
    }
    
    // Why This Opportunity
    if (formData.briefWhyThisOpportunity) {
      sections.push(`**Why this opportunity?**\n\n${formData.briefWhyThisOpportunity}`);
    }
    
    // Deliverables
    if (formData.briefDeliverables) {
      sections.push(`**Deliverables**\n\n${formData.briefDeliverables}`);
    }
    
    // Compensation
    if (formData.briefCompensation) {
      sections.push(`**Compensation**\n\n${formData.briefCompensation}`);
    }
    
    return sections.join('\n\n');
  };

  // Refine brief with AI using R/HOOD template
  const handleRefineBriefWithAI = async () => {
    const rawBrief = generateBrief();
    if (!rawBrief.trim()) {
      toast({
        title: "No brief to refine",
        description: "Please fill out the brief questionnaire first.",
        variant: "destructive",
      });
      return;
    }

    setIsRefining(true);
    try {
      const response = await fetch("/api/ai/refine-brief", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brief: rawBrief,
          template: "rhood-standard",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to refine brief");
      }

      const data = await response.json();
      const refinedBrief = data.refinedBrief || rawBrief;

      // Store refined brief in description field (it will be saved as the full brief)
      // Note: In a production system, you might want to parse the refined brief back into fields
      // For now, we store it as-is since it follows the same format
      setFormData({ ...formData, description: refinedBrief });
      
      setAiRefineDialogOpen(false);
      toast({
        title: "Brief refined",
        description: "Your brief has been refined by AI using the R/HOOD template. Review the preview to see changes.",
      });
      
      // Show preview automatically after refinement
      setTimeout(() => {
        setBriefPreviewOpen(true);
      }, 500);
    } catch (error) {
      console.error("Error refining brief:", error);
      toast({
        title: "Refinement failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to refine brief. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefining(false);
    }
  };

  const handleCreateOrDraft = async ({
    publishImmediately,
  }: {
    publishImmediately: boolean;
  }) => {
    // Generate brief if questionnaire is filled out
    const generatedBrief = generateBrief();
    const finalDescription = generatedBrief || formData.description;
    setIsSubmitting(true);
    try {
      if (!formData.date || !formData.time || !formData.endTime) {
        toast({
          title: "Missing Schedule",
          description: "Please provide a date, start time, and finish time.",
          variant: "destructive",
        });
        return;
      }

      // Validate date range if in range mode
      if (formData.dateType === "range" && !formData.endDate) {
        toast({
          title: "Missing End Date",
          description: "Please provide an end date for the campaign range.",
          variant: "destructive",
        });
        return;
      }

      if (formData.dateType === "range" && formData.endDate < formData.date) {
        toast({
          title: "Invalid Date Range",
          description: "End date must be on or after the start date.",
          variant: "destructive",
        });
        return;
      }

      const eventStart = new Date(`${formData.date}T${formData.time}`);
      let eventEnd: Date;

      if (formData.dateType === "range") {
        // For date range, use end date with end time
        eventEnd = new Date(`${formData.endDate}T${formData.endTime}`);
      } else {
        // For single date, use same date with end time
        eventEnd = new Date(`${formData.date}T${formData.endTime}`);
      }

      if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
        toast({
          title: "Invalid Time",
          description: "Please enter a valid start and finish time.",
          variant: "destructive",
        });
        return;
      }

      if (eventEnd <= eventStart) {
        toast({
          title: "Invalid Schedule",
          description: "Finish time must be after the start time.",
          variant: "destructive",
        });
        return;
      }

      if (!formData.location.trim()) {
        toast({
          title: "Location Required",
          description: "Please choose a location for this opportunity.",
          variant: "destructive",
        });
        return;
      }

      // Check if opportunities table exists first
      const { error: tableCheckError } = await supabase
        .from("opportunities")
        .select("id")
        .limit(1);

      if (tableCheckError) {
        if (
          tableCheckError.message?.includes("relation") &&
          tableCheckError.message?.includes("does not exist")
        ) {
          toast({
            title: "Database Setup Required",
            description:
              "Opportunities table doesn't exist. Please create it in Supabase dashboard first.",
            variant: "destructive",
          });
          return;
        }
        throw tableCheckError;
      }

      // Ensure the user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("Authentication required:", authError);
        toast({
          title: "Authentication Required",
          description: "You must be logged in to create an opportunity.",
          variant: "destructive",
        });
        return;
      }

      // Fetch organizer profile to use a friendly name
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("first_name, last_name, dj_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.warn("Unable to fetch organizer profile:", profileError);
      }

      const organizerName =
        profile?.dj_name?.trim() ||
        [profile?.first_name, profile?.last_name]
          .map((part) => (part ? part.trim() : ""))
          .filter(Boolean)
          .join(" ") ||
        user.email?.split("@")[0] ||
        "R/HOOD Organizer";

      const eventDate =
        formData.date && formData.time
          ? new Date(`${formData.date}T${formData.time}`).toISOString()
          : formData.date
          ? new Date(formData.date).toISOString()
          : null;

      const paymentAmount = formData.pay
        ? parseFloat(formData.pay.replace(/[£,]/g, ""))
        : null;

      const genreValue =
        selectedGenres.length > 0
          ? selectedGenres.join(", ")
          : formData.genre || null;

      // Validate required brief fields - all sections must be filled
      const requiredFields = [
        { field: 'briefConcept', label: 'The Idea' },
        { field: 'briefEventDetails', label: 'Event Details' },
        { field: 'briefRequirements', label: 'Requirements & Expectations' },
        { field: 'briefBrandIntegration', label: 'Brand Integration' },
        { field: 'briefWhyThisOpportunity', label: 'Why This Opportunity?' },
        { field: 'briefDeliverables', label: 'Deliverables' },
        { field: 'briefCompensation', label: 'Compensation' },
      ];

      for (const { field, label } of requiredFields) {
        if (!formData[field as keyof typeof formData]?.toString().trim()) {
          toast({
            title: "Brief Section Required",
            description: `Please fill out the "${label}" section in the brief questionnaire.`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      if (!formData.shortSummary.trim()) {
        toast({
          title: "Short Summary Required",
          description: "Please provide a short summary that will be visible to DJs.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Generate brief from questionnaire (always required now)
      const generatedBrief = generateBrief();
      
      // Process brief to convert markdown links to display text only
      const processedDescription = getDisplayText(generatedBrief);

      const { error } = await supabase.from("opportunities").insert({
        title: formData.title.trim(),
        description: processedDescription, // Full brief (visible after acceptance)
        short_summary: formData.shortSummary.trim(), // Public summary (visible before applying)
        location: formData.location.trim(),
        event_date: eventStart.toISOString(),
        event_end_time: eventEnd.toISOString(),
        payment: paymentAmount,
        genre: genreValue,
        skill_level: formData.requirements || null,
        organizer_id: user.id,
        organizer_name: organizerName,
        is_active:
          publishImmediately && formData.status === "active" ? true : false,
        is_archived: false,
        image_url: formData.imageUrl || null,
      });

      if (error) {
        console.error("Supabase insert error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        throw error;
      }

      toast({
        title: publishImmediately ? "Success" : "Draft Saved",
        description: publishImmediately
          ? "Opportunity created successfully!"
          : "Opportunity saved as draft successfully!",
      });

      router.push("/admin/opportunities");
    } catch (error: any) {
      console.error("Error creating opportunity:", error);
      toast({
        title: "Opportunity Not Saved",
        description:
          error?.message ||
          "Failed to save the opportunity. Please review the form and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-blur-in">
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

            {/* Short Summary - Public, shown before applying */}
            <div className="space-y-2">
              <Label htmlFor="shortSummary" className="text-foreground">
                Short Summary (Public) *
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                This summary will be visible to all DJs before they apply. Keep it concise and compelling.
              </p>
              <Textarea
                id="shortSummary"
                placeholder="A brief, compelling summary that will entice DJs to apply..."
                value={formData.shortSummary}
                onChange={(e) =>
                  setFormData({ ...formData, shortSummary: e.target.value })
                }
                className="bg-secondary border-border text-foreground min-h-[80px]"
                required
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.shortSummary.length}/300 characters
              </p>
            </div>

            {/* Structured Brief Questionnaire - Required */}
            <div className="space-y-4 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground font-semibold text-lg">
                    Full Brief (Visible after acceptance)
                </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fill out the structured brief below. This will only be visible to DJs after they are accepted.
                  </p>
                </div>
                  <Button
                    type="button"
                  variant="outline"
                    size="sm"
                    onClick={() => setAiRefineDialogOpen(true)}
                  disabled={!formData.briefConcept.trim() || !formData.briefEventDetails.trim() || !formData.briefRequirements.trim() || !formData.briefBrandIntegration.trim() || !formData.briefWhyThisOpportunity.trim() || !formData.briefDeliverables.trim() || !formData.briefCompensation.trim()}
                  className="h-8"
                  >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Refine with AI
                  </Button>
                </div>

              <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="briefConcept" className="text-foreground font-semibold">
                      The Idea *
                    </Label>
              <Textarea
                      id="briefConcept"
                      placeholder="Describe the core concept and vision for this opportunity. What is the brand trying to achieve? What makes this opportunity unique? What's the overall goal and message?"
                      value={formData.briefConcept}
                      onChange={(e) =>
                        setFormData({ ...formData, briefConcept: e.target.value })
                      }
                className="bg-secondary border-border text-foreground min-h-[120px]"
                required
              />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="briefEventDetails" className="text-foreground font-semibold">
                      Event Details *
                    </Label>
                    <Textarea
                      id="briefEventDetails"
                      placeholder="Provide details about the event or gig: Date, time, duration, venue/location, expected audience size, event type (club night, festival, brand activation, etc.), and any special requirements or unique aspects of the event."
                      value={formData.briefEventDetails}
                      onChange={(e) =>
                        setFormData({ ...formData, briefEventDetails: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground min-h-[120px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="briefRequirements" className="text-foreground font-semibold">
                      Requirements & Expectations *
                    </Label>
                    <Textarea
                      id="briefRequirements"
                      placeholder="What are the specific requirements for the DJ? Equipment needed, set duration, genre preferences, technical requirements, dress code, arrival time, soundcheck details, and any other expectations or obligations."
                      value={formData.briefRequirements}
                      onChange={(e) =>
                        setFormData({ ...formData, briefRequirements: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground min-h-[120px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="briefBrandIntegration" className="text-foreground font-semibold">
                      Brand Integration *
                    </Label>
                    <Textarea
                      id="briefBrandIntegration"
                      placeholder="How will the brand be integrated? Product placement, brand mentions, social media requirements, content creation expectations, exclusivity agreements, and any brand guidelines or messaging that needs to be followed."
                      value={formData.briefBrandIntegration}
                      onChange={(e) =>
                        setFormData({ ...formData, briefBrandIntegration: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground min-h-[120px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="briefWhyThisOpportunity" className="text-foreground font-semibold">
                      Why This Opportunity? *
                    </Label>
                    <Textarea
                      id="briefWhyThisOpportunity"
                      placeholder="What makes this opportunity valuable for DJs? Exposure, networking, career growth, creative freedom, audience reach, media coverage, or other benefits. Why should DJs be excited about this opportunity?"
                      value={formData.briefWhyThisOpportunity}
                      onChange={(e) =>
                        setFormData({ ...formData, briefWhyThisOpportunity: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground min-h-[120px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="briefDeliverables" className="text-foreground font-semibold">
                      Deliverables *
                    </Label>
                    <Textarea
                      id="briefDeliverables"
                      placeholder="What will be delivered? Performance requirements, content creation (photos, videos, social posts), exclusivity periods, usage rights, and any other deliverables expected from the DJ."
                      value={formData.briefDeliverables}
                      onChange={(e) =>
                        setFormData({ ...formData, briefDeliverables: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground min-h-[120px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="briefCompensation" className="text-foreground font-semibold">
                      Compensation *
                    </Label>
                    <Textarea
                      id="briefCompensation"
                      placeholder="Payment details: Fee amount, payment schedule, additional benefits (travel, accommodation, meals, equipment), royalties, or other compensation. Be specific about what's included."
                      value={formData.briefCompensation}
                      onChange={(e) =>
                        setFormData({ ...formData, briefCompensation: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground min-h-[100px]"
                      required
                    />
                  </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBriefPreviewOpen(true)}
                    disabled={!formData.briefConcept.trim() || !formData.briefEventDetails.trim() || !formData.briefRequirements.trim() || !formData.briefBrandIntegration.trim() || !formData.briefWhyThisOpportunity.trim() || !formData.briefDeliverables.trim() || !formData.briefCompensation.trim()}
                  >
                    Preview Brief
                  </Button>
                </div>
              </div>
            </div>

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
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="location"
                  className="text-foreground flex items-center"
                >
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
                <Label htmlFor="pay" className="text-foreground flex items-center">
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
                    className="text-foreground flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    {formData.dateType === "range" ? "Start Date" : "Date"}
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="bg-secondary border-border text-foreground"
                    required
                  />
                </div>

                {formData.dateType === "range" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="endDate"
                      className="text-foreground flex items-center"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      End Date
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground"
                      required={formData.dateType === "range"}
                      min={formData.date}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="time"
                    className="text-foreground flex items-center"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Start Time
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) =>
                      setFormData({ ...formData, time: e.target.value })
                    }
                    className="bg-secondary border-border text-foreground"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="endTime"
                    className="text-foreground flex items-center"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Finish Time
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="bg-secondary border-border text-foreground"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground flex items-center">
                <Music className="h-4 w-4 mr-2" />
                Genres
              </Label>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Badge
                    key={genre}
                    variant={
                      selectedGenres.includes(genre) ? "default" : "outline"
                    }
                    className={`cursor-pointer transition-all duration-200 ${
                      selectedGenres.includes(genre)
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border-border text-foreground hover:bg-accent"
                    }`}
                    onClick={() => handleGenreToggle(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
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
                </SelectContent>
              </Select>
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
            className="bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isSubmitting ? "Creating..." : "Create Opportunity"}
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
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Refine Brief with AI
            </DialogTitle>
            <DialogDescription>
              AI will refine your brief using the R/HOOD template to ensure consistency, clarity, and brand voice.
              All key information will be preserved and enhanced.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Brief Preview</Label>
              <div className="p-3 bg-secondary border border-border rounded-md text-sm text-muted-foreground max-h-64 overflow-y-auto whitespace-pre-wrap">
                {generateBrief() || "Fill out the brief questionnaire first"}
              </div>
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
              onClick={handleRefineBriefWithAI}
              className="bg-brand-green text-brand-black hover:bg-brand-green/90"
              disabled={isRefining || !formData.briefConcept.trim() || !formData.briefEventDetails.trim() || !formData.briefRequirements.trim() || !formData.briefBrandIntegration.trim() || !formData.briefWhyThisOpportunity.trim() || !formData.briefDeliverables.trim() || !formData.briefCompensation.trim()}
            >
              {isRefining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refining...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Refine Brief
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Brief Preview Dialog */}
      <Dialog open={briefPreviewOpen} onOpenChange={setBriefPreviewOpen}>
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Brief Preview</DialogTitle>
            <DialogDescription>
              This is how your brief will appear to DJs
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-foreground bg-secondary p-4 rounded-md border border-border">
                {generateBrief() || "Fill out the brief questionnaire to see preview"}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBriefPreviewOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
