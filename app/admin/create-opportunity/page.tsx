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
    briefFormat: "",
    briefLocations: "",
    briefContentCapture: "",
    briefEpisodeFlow: "",
    briefAccessibility: "",
    briefCollaboration: "",
    briefContentFirst: "",
    briefEntertainment: "",
    briefPilotEpisodes: "",
    briefDeliverables: "",
    briefInvestment: "",
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
  // Matches the style of example briefs like "CROSSFADE x HERCULES"
  const generateBrief = () => {
    const sections = [];
    
    // Concept proposal / The idea
    if (formData.briefConcept) {
      sections.push(`**Concept proposal: ${formData.title || 'OPPORTUNITY'}\n\n**The idea**\n\n${formData.briefConcept}`);
    }
    
    // Format overview with sub-sections
    const formatParts = [];
    if (formData.briefFormat) {
      formatParts.push(`**Collaborative B2B2B2B session**\n\n${formData.briefFormat}`);
    }
    if (formData.briefLocations) {
      formatParts.push(`**Unique locations**\n\n${formData.briefLocations}`);
    }
    if (formData.briefContentCapture) {
      formatParts.push(`**Cinematic content capture**\n\n${formData.briefContentCapture}`);
    }
    
    if (formatParts.length > 0) {
      sections.push(`**Format overview**\n\n${formatParts.join('\n\n')}`);
    }
    
    // Episode flow
    if (formData.briefEpisodeFlow) {
      sections.push(`**Episode flow**\n\n${formData.briefEpisodeFlow}`);
    }
    
    // Why it works? (numbered points)
    const whyItWorksParts = [];
    if (formData.briefAccessibility) {
      whyItWorksParts.push(`**1. Accessibility**\n\n${formData.briefAccessibility}`);
    }
    if (formData.briefCollaboration) {
      whyItWorksParts.push(`**2. Collaboration**\n\n${formData.briefCollaboration}`);
    }
    if (formData.briefContentFirst) {
      whyItWorksParts.push(`**3. Content-first activation**\n\n${formData.briefContentFirst}`);
    }
    if (formData.briefEntertainment) {
      whyItWorksParts.push(`**4. Entertainment value**\n\n${formData.briefEntertainment}`);
    }
    
    if (whyItWorksParts.length > 0) {
      sections.push(`**Why it works?**\n\n${whyItWorksParts.join('\n\n')}`);
    }
    
    // Pilot Episodes
    if (formData.briefPilotEpisodes) {
      sections.push(`**Pilot Episodes**\n\n${formData.briefPilotEpisodes}`);
    }
    
    // Deliverables
    if (formData.briefDeliverables) {
      sections.push(`**Deliverables**\n\n${formData.briefDeliverables}`);
    }
    
    // Investment
    if (formData.briefInvestment) {
      sections.push(`**Investment**\n\n${formData.briefInvestment}`);
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
        { field: 'briefFormat', label: 'Format Overview - Collaborative Sessions' },
        { field: 'briefLocations', label: 'Format Overview - Unique Locations' },
        { field: 'briefContentCapture', label: 'Format Overview - Cinematic Content Capture' },
        { field: 'briefEpisodeFlow', label: 'Episode Flow' },
        { field: 'briefAccessibility', label: 'Why It Works - Accessibility' },
        { field: 'briefCollaboration', label: 'Why It Works - Collaboration' },
        { field: 'briefContentFirst', label: 'Why It Works - Content-First Activation' },
        { field: 'briefEntertainment', label: 'Why It Works - Entertainment Value' },
        { field: 'briefPilotEpisodes', label: 'Pilot Episodes' },
        { field: 'briefDeliverables', label: 'Deliverables' },
        { field: 'briefInvestment', label: 'Investment' },
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
                  disabled={!formData.briefConcept.trim() || !formData.briefFormat.trim() || !formData.briefLocations.trim() || !formData.briefContentCapture.trim() || !formData.briefEpisodeFlow.trim() || !formData.briefAccessibility.trim() || !formData.briefCollaboration.trim() || !formData.briefContentFirst.trim() || !formData.briefEntertainment.trim() || !formData.briefPilotEpisodes.trim() || !formData.briefDeliverables.trim() || !formData.briefInvestment.trim()}
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
                      placeholder="e.g., DJing is no longer confined to dark booths or club stages. It's become a social, shareable experience that can happen anywhere. Together with [Brand] and the launch of their [Product], we will showcase just how easy, mobile, and collaborative DJing can be. Our format: fun, cinematic jam sessions where DJs play back-to-back in unexpected, immersive locations. Bringing music and culture directly to the people."
                      value={formData.briefConcept}
                      onChange={(e) =>
                        setFormData({ ...formData, briefConcept: e.target.value })
                      }
                className="bg-secondary border-border text-foreground min-h-[120px]"
                required
              />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="briefFormat" className="text-foreground font-semibold">
                      Format Overview - Collaborative Sessions *
                    </Label>
                    <Textarea
                      id="briefFormat"
                      placeholder="e.g., 4 DJs play one track each, passing the decks in real time. The challenge: keep the energy alive while blending genres, personalities, and vibes. The result: part jam session, part hangout, part social experiment."
                      value={formData.briefFormat}
                      onChange={(e) =>
                        setFormData({ ...formData, briefFormat: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground min-h-[100px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="briefLocations" className="text-foreground font-semibold">
                      Format Overview - Unique Locations *
                    </Label>
                    <Textarea
                      id="briefLocations"
                      placeholder="e.g., From the back of a Mercedes van cruising through London, to intimate living rooms, rooftops, or surprise pop-up spots. The space becomes both a stage and a character in the experience."
                      value={formData.briefLocations}
                      onChange={(e) =>
                        setFormData({ ...formData, briefLocations: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground min-h-[100px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="briefContentCapture" className="text-foreground font-semibold">
                      Format Overview - Cinematic Content Capture *
                    </Label>
                    <Textarea
                      id="briefContentCapture"
                      placeholder="e.g., Professional videographer + multi-angle GoPros. 360° GoPro mounted on the roof to capture the journey through the city. Dynamic storytelling that blends music, community, and location into one."
                      value={formData.briefContentCapture}
                      onChange={(e) =>
                        setFormData({ ...formData, briefContentCapture: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground min-h-[100px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="briefEpisodeFlow" className="text-foreground font-semibold">
                      Episode Flow *
                    </Label>
                    <Textarea
                      id="briefEpisodeFlow"
                      placeholder="e.g., Warm-up + introductions. DJs rotate tracks, passing the decks. Set builds organically. Capturing both the music and the vibe of DJs hanging out. One-hour episode: entertaining, social, and easy to binge."
                      value={formData.briefEpisodeFlow}
                      onChange={(e) =>
                        setFormData({ ...formData, briefEpisodeFlow: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground min-h-[100px]"
                      required
                    />
                  </div>

                  <div className="space-y-4 border-t border-border pt-4">
                    <Label className="text-foreground font-semibold">Why It Works?</Label>
                    
                    <div className="space-y-2">
                      <Label htmlFor="briefAccessibility" className="text-sm text-muted-foreground">
                        1. Accessibility *
                      </Label>
                      <Textarea
                        id="briefAccessibility"
                        placeholder="e.g., DJing becomes less intimidating, more playful. Positioned as the tool that makes it possible. Simple, mobile and for everyone."
                        value={formData.briefAccessibility}
                        onChange={(e) =>
                          setFormData({ ...formData, briefAccessibility: e.target.value })
                        }
                        className="bg-secondary border-border text-foreground min-h-[80px]"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="briefCollaboration" className="text-sm text-muted-foreground">
                        2. Collaboration *
                      </Label>
                      <Textarea
                        id="briefCollaboration"
                        placeholder="e.g., Celebrates the community side of DJ culture. Not just '1 star DJ' but a collective moment where differences meet on the decks."
                        value={formData.briefCollaboration}
                        onChange={(e) =>
                          setFormData({ ...formData, briefCollaboration: e.target.value })
                        }
                        className="bg-secondary border-border text-foreground min-h-[80px]"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="briefContentFirst" className="text-sm text-muted-foreground">
                        3. Content-First Activation *
                      </Label>
                      <Textarea
                        id="briefContentFirst"
                        placeholder="e.g., 3 X premium episodes with short form cut downs for TikTok, IG Reels, and YouTube Shorts. Ready for brand channels, DJ self-promotion, and social amplification."
                        value={formData.briefContentFirst}
                        onChange={(e) =>
                          setFormData({ ...formData, briefContentFirst: e.target.value })
                        }
                        className="bg-secondary border-border text-foreground min-h-[80px]"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="briefEntertainment" className="text-sm text-muted-foreground">
                        4. Entertainment Value *
                      </Label>
                      <Textarea
                        id="briefEntertainment"
                        placeholder="e.g., Spontaneous, raw, and unpredictable. Watchable not just for DJs, but for wider audiences who enjoy culture, music, and city backdrops."
                        value={formData.briefEntertainment}
                        onChange={(e) =>
                          setFormData({ ...formData, briefEntertainment: e.target.value })
                        }
                        className="bg-secondary border-border text-foreground min-h-[80px]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="briefPilotEpisodes" className="text-foreground font-semibold">
                      Pilot Episodes *
                    </Label>
                    <Textarea
                      id="briefPilotEpisodes"
                      placeholder="e.g., 3 Episodes filmed in the back of a Mercedes van across London. Featuring local and international DJs across genres (house, hip hop, amapiano, drum & bass, etc.) for exciting crossover moments. Episodes released weekly to create consistency and build anticipation."
                      value={formData.briefPilotEpisodes}
                      onChange={(e) =>
                        setFormData({ ...formData, briefPilotEpisodes: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground min-h-[100px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="briefDeliverables" className="text-foreground font-semibold">
                      Deliverables *
                    </Label>
                    <Textarea
                      id="briefDeliverables"
                      placeholder="e.g., 3 x 1-hour full episodes (filmed, edited, produced). Social cutdowns optimised for TikTok, IG Reels, and YouTube Shorts. Brand integration: featured naturally throughout (hands-on use, subtle placements, organic storytelling). End-to-end production: R/HOOD handles all aspects. Talent programming, logistics, filming, editing, and delivery."
                      value={formData.briefDeliverables}
                      onChange={(e) =>
                        setFormData({ ...formData, briefDeliverables: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground min-h-[120px]"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="briefInvestment" className="text-foreground font-semibold">
                      Investment *
                    </Label>
                    <Textarea
                      id="briefInvestment"
                      placeholder="e.g., €9,800 + Hercules DJ decks for talent use"
                      value={formData.briefInvestment}
                      onChange={(e) =>
                        setFormData({ ...formData, briefInvestment: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground min-h-[60px]"
                      required
                    />
                  </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBriefPreviewOpen(true)}
                    disabled={!formData.briefConcept.trim() || !formData.briefFormat.trim() || !formData.briefLocations.trim() || !formData.briefContentCapture.trim() || !formData.briefEpisodeFlow.trim() || !formData.briefAccessibility.trim() || !formData.briefCollaboration.trim() || !formData.briefContentFirst.trim() || !formData.briefEntertainment.trim() || !formData.briefPilotEpisodes.trim() || !formData.briefDeliverables.trim() || !formData.briefInvestment.trim()}
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
              disabled={isRefining || !formData.briefConcept.trim() || !formData.briefFormat.trim() || !formData.briefLocations.trim() || !formData.briefContentCapture.trim() || !formData.briefEpisodeFlow.trim() || !formData.briefAccessibility.trim() || !formData.briefCollaboration.trim() || !formData.briefContentFirst.trim() || !formData.briefEntertainment.trim() || !formData.briefPilotEpisodes.trim() || !formData.briefDeliverables.trim() || !formData.briefInvestment.trim()}
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
