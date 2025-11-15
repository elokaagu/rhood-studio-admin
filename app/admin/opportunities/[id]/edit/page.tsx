"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Calendar,
  MapPin,
  Music,
  Save,
  X,
  ArrowLeft,
  Clock,
  CheckCircle,
  Link as LinkIcon,
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

const DESCRIPTION_MAX_LENGTH = 350;

export default function EditOpportunityPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const opportunityId = params.id;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch opportunity data from database
  const fetchOpportunity = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", opportunityId as string)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Parse the event_date to separate date and time
        const eventDate = data.event_date ? new Date(data.event_date) : null;
        const dateStr = eventDate ? eventDate.toISOString().split("T")[0] : "";
        const timeStr = eventDate
          ? eventDate.toTimeString().split(" ")[0].substring(0, 5)
          : "";
        const eventEnd = data.event_end_time
          ? new Date(data.event_end_time)
          : null;
        const endTimeStr = eventEnd
          ? eventEnd.toTimeString().split(" ")[0].substring(0, 5)
          : "";
        const endDateStr = eventEnd ? eventEnd.toISOString().split("T")[0] : "";

        // Determine if this is a date range (different dates) or single date
        const isRange =
          eventDate &&
          eventEnd &&
          dateStr !== endDateStr &&
          !isNaN(eventDate.getTime()) &&
          !isNaN(eventEnd.getTime());

        setFormData({
          title: data.title || "",
          description: (data.description || "").slice(0, DESCRIPTION_MAX_LENGTH),
          location: data.location || "",
          locationPlaceId: "",
          dateType: isRange ? "range" : "single",
          date: dateStr,
          endDate: isRange ? endDateStr : "",
          time: timeStr,
          endTime: endTimeStr,
          pay: data.payment ? data.payment.toString() : "",
          genre: data.genre || "",
          requirements: data.skill_level || "",
          additionalInfo: "",
          status: data.is_active ? "active" : "draft",
          imageUrl: data.image_url || "",
          archived: data.is_archived ?? false,
        });
      }
    } catch (error) {
      console.error("Error fetching opportunity:", error);
      toast({
        title: "Error",
        description: "Failed to load opportunity data. Using demo data.",
        variant: "destructive",
      });
      // Fallback to demo data
      const opportunities = [
        {
          id: 1,
          title: "Underground Warehouse Rave",
          location: "East London",
          date: "2024-08-15",
          endTime: "",
          pay: "£300",
          applicants: 12,
          status: "active",
          is_archived: false,
          genre: "Techno",
          description:
            "High-energy underground techno event in a converted warehouse space.",
          requirements: "Professional DJ equipment, 3+ years experience",
          additionalInfo: "Contact: events@warehouse.com",
        },
        {
          id: 2,
          title: "Rooftop Summer Sessions",
          location: "Shoreditch",
          date: "2024-08-20",
          endTime: "",
          pay: "£450",
          applicants: 8,
          status: "active",
          is_archived: false,
          genre: "House",
          description: "Sunset house music sessions with panoramic city views.",
          requirements: "House music experience, own equipment preferred",
          additionalInfo: "Venue provides sound system",
        },
        {
          id: 3,
          title: "Club Residency Audition",
          location: "Camden",
          date: "2024-08-25",
          endTime: "",
          pay: "£200 + Residency",
          applicants: 15,
          status: "completed",
          is_archived: false,
          genre: "Drum & Bass",
          selected: "Alex Thompson",
          description: "Weekly residency opportunity at premier London club.",
          requirements: "Drum & Bass expertise, club experience",
          additionalInfo: "Selected candidate will receive ongoing residency",
        },
      ];

      const opportunity = opportunities.find(
        (opp) => opp.id === parseInt(opportunityId as string)
      );

      setFormData({
        title: opportunity?.title || "",
        description: (opportunity?.description || "").slice(
          0,
          DESCRIPTION_MAX_LENGTH
        ),
        location: opportunity?.location || "",
        locationPlaceId: "",
        dateType: "single" as "single" | "range",
        date: opportunity?.date || "",
        endDate: "",
        time: "",
        endTime: opportunity?.endTime || "",
        pay: opportunity?.pay || "",
        genre: opportunity?.genre || "",
        requirements: opportunity?.requirements || "",
        additionalInfo: opportunity?.additionalInfo || "",
        status: opportunity?.status || "draft",
        imageUrl: "",
        archived: opportunity?.is_archived ?? false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load opportunity data on component mount
  useEffect(() => {
    fetchOpportunity();
  }, [opportunityId]); // eslint-disable-line react-hooks/exhaustive-deps

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
    archived: false,
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // Parse payment amount
      const paymentAmount = formData.pay
        ? parseFloat(formData.pay.replace(/[£,]/g, ""))
        : null;

      const { error } = await supabase
        .from("opportunities")
        .update({
          title: formData.title,
          description: formData.description
            .trim()
            .slice(0, DESCRIPTION_MAX_LENGTH),
          location: formData.location.trim(),
          event_date: eventStart.toISOString(),
          event_end_time: eventEnd.toISOString(),
          payment: paymentAmount,
          genre: formData.genre,
          skill_level: formData.requirements,
          is_active: formData.status === "active" && !formData.archived,
          is_archived: formData.archived,
          image_url: formData.imageUrl || null,
        })
        .eq("id", opportunityId as string);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Opportunity updated successfully!",
      });

      router.push(`/admin/opportunities/${opportunityId}`);
    } catch (error) {
      console.error("Error updating opportunity:", error);
      toast({
        title: "Error",
        description: "Failed to update opportunity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
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

      const paymentAmount = formData.pay
        ? parseFloat(formData.pay.replace(/[£,]/g, ""))
        : null;

      const { error } = await supabase
        .from("opportunities")
        .update({
          title: formData.title,
          description: formData.description
            .trim()
            .slice(0, DESCRIPTION_MAX_LENGTH),
          location: formData.location.trim(),
          event_date: eventStart.toISOString(),
          event_end_time: eventEnd.toISOString(),
          payment: paymentAmount,
          genre: formData.genre,
          skill_level: formData.requirements,
          is_active: false, // Draft is not active
          is_archived: formData.archived,
          image_url: formData.imageUrl || null,
        })
        .eq("id", opportunityId as string);

      if (error) {
        throw error;
      }

      toast({
        title: "Draft Saved",
        description: "Opportunity saved as draft successfully!",
      });

      router.push(`/admin/opportunities/${opportunityId}`);
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error",
        description: "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <p className={textStyles.body.regular}>Loading opportunity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/opportunities/${opportunityId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className={textStyles.headline.section}>EDIT OPPORTUNITY</h1>
            <p className={textStyles.body.regular}>
              Update opportunity information
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              <Textarea
                ref={descriptionTextareaRef}
                id="description"
                placeholder="Describe the event, atmosphere, and what you're looking for..."
                value={formData.description}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Only update if display length is within limit
                  if (getDisplayLength(newValue) <= DESCRIPTION_MAX_LENGTH) {
                    setFormData({ ...formData, description: newValue });
                  }
                }}
                className="bg-secondary border-border text-foreground min-h-[100px]"
                required
              />
              <p className="text-xs text-muted-foreground text-right">
                {getDisplayLength(formData.description)}/{DESCRIPTION_MAX_LENGTH} characters
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
                <Label htmlFor="location" className={textStyles.body.regular}>
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
                <Label htmlFor="pay" className={textStyles.body.regular}>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="date"
                  className={`${textStyles.body.regular} flex items-center`}
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
                    className={`${textStyles.body.regular} flex items-center`}
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

              <div className="space-y-2">
                <Label
                  htmlFor="time"
                  className={`${textStyles.body.regular} flex items-center`}
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
                  className={`${textStyles.body.regular} flex items-center`}
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
        <div className="flex items-center justify-end space-x-4">
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
        <DialogContent className="bg-card border-border">
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
    </div>
  );
}
