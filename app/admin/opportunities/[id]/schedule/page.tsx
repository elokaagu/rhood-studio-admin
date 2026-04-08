"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RhoodDatePicker, RhoodTimePicker } from "@/components/ui/rhood-pickers";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LocationAutocomplete from "@/components/location-autocomplete";
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
import {
  buildScheduleUpdatePayload,
  opportunityRowToScheduleForm,
  saveOpportunitySchedule,
  validateScheduleForm,
  type ScheduleFormState,
} from "@/lib/admin/opportunities/opportunity-schedule";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Save,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

const emptyForm = (): ScheduleFormState => ({
  eventDate: "",
  startTime: "",
  endTime: "",
  venue: "",
  locationPlaceId: "",
  setupTime: "",
  soundcheckTime: "",
  capacity: "",
  notes: "",
  scheduleStatus: "scheduled",
});

export default function ScheduleEventPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const opportunityId = params.id as string;

  const [opportunityTitle, setOpportunityTitle] = useState("");
  const [formData, setFormData] = useState<ScheduleFormState>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchOpportunity = async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      const userProfile = await getCurrentUserProfile();
      const userId = await getCurrentUserId();

      let query = supabase
        .from("opportunities")
        .select(
          "id, title, event_date, event_end_time, location, schedule_details, organizer_id"
        )
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
        setOpportunityTitle(data.title || "Opportunity");
        setFormData(opportunityRowToScheduleForm(data));
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

  const persist = async (mode: "draft" | "publish") => {
    setIsSubmitting(true);
    try {
      const validated = validateScheduleForm(formData);
      if (!validated.ok) {
        toast({
          title: "Check your entries",
          description: validated.message,
          variant: "destructive",
        });
        return;
      }

      const payload = buildScheduleUpdatePayload(formData, validated, mode);
      const result = await saveOpportunitySchedule(opportunityId, payload);
      if (!result.ok) {
        throw new Error(result.message);
      }

      toast({
        title: mode === "publish" ? "Schedule saved" : "Draft saved",
        description:
          mode === "publish"
            ? "Event schedule has been updated."
            : "Schedule draft saved.",
      });

      router.push(`/admin/opportunities/${opportunityId}`);
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Save failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not save schedule. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void persist("publish");
  };

  const handleSaveDraft = () => {
    void persist("draft");
  };

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
        <h1 className={textStyles.headline.section}>Could not load schedule</h1>
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
    <div className="space-y-6 animate-blur-in">
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
            <h1 className={textStyles.headline.section}>SCHEDULE EVENT</h1>
            <p className={textStyles.body.regular}>
              Schedule event details for {opportunityTitle}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className={textStyles.subheading.small}>
              Event Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventDate" className={textStyles.body.regular}>
                  <Calendar className="h-4 w-4 mr-2 inline" />
                  Event Date
                </Label>
                <RhoodDatePicker
                  value={formData.eventDate}
                  onChange={(value) =>
                    setFormData({ ...formData, eventDate: value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue" className={textStyles.body.regular}>
                  <MapPin className="h-4 w-4 mr-2 inline" />
                  Venue
                </Label>
                <LocationAutocomplete
                  id="venue"
                  placeholder="Search for a venue or address"
                  value={formData.venue}
                  onValueChange={(value) =>
                    setFormData((prev: ScheduleFormState) => ({
                      ...prev,
                      venue: value,
                      locationPlaceId: "",
                    }))
                  }
                  onLocationSelect={(selection) =>
                    setFormData((prev: ScheduleFormState) => ({
                      ...prev,
                      venue: selection.formattedAddress ?? selection.description,
                      locationPlaceId: selection.placeId,
                    }))
                  }
                  className="bg-secondary border-border text-foreground"
                  country="gb"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className={textStyles.body.regular}>
                  <Clock className="h-4 w-4 mr-2 inline" />
                  Start Time
                </Label>
                <RhoodTimePicker
                  value={formData.startTime}
                  onChange={(value) =>
                    setFormData({ ...formData, startTime: value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className={textStyles.body.regular}>
                  <Clock className="h-4 w-4 mr-2 inline" />
                  End Time
                </Label>
                <RhoodTimePicker
                  value={formData.endTime}
                  onChange={(value) =>
                    setFormData({ ...formData, endTime: value })
                  }
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              If the event ends after midnight, end time can be earlier on the
              clock than start time (e.g. 20:00–02:00); it will be stored as the
              next calendar day.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className={textStyles.subheading.small}>
              Setup Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="setupTime" className={textStyles.body.regular}>
                  <Clock className="h-4 w-4 mr-2 inline" />
                  Setup Time
                </Label>
                <RhoodTimePicker
                  value={formData.setupTime}
                  onChange={(value) =>
                    setFormData({ ...formData, setupTime: value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="soundcheckTime"
                  className={textStyles.body.regular}
                >
                  <Clock className="h-4 w-4 mr-2 inline" />
                  Soundcheck Time
                </Label>
                <RhoodTimePicker
                  value={formData.soundcheckTime}
                  onChange={(value) =>
                    setFormData({ ...formData, soundcheckTime: value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity" className={textStyles.body.regular}>
                  <Users className="h-4 w-4 mr-2 inline" />
                  Capacity
                </Label>
                <Input
                  id="capacity"
                  inputMode="numeric"
                  placeholder="e.g. 200"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className={textStyles.subheading.small}>
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes" className={textStyles.body.regular}>
                Event Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Special instructions, equipment requirements, contact details, etc."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="bg-secondary border-border text-foreground min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className={textStyles.body.regular}>
                Schedule Status
              </Label>
              <p className="text-xs text-muted-foreground">
                Stored in <code className="text-xs">schedule_details</code> on
                this opportunity (separate from listing status on the edit page).
              </p>
              <Select
                value={formData.scheduleStatus}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, scheduleStatus: value })
                }
              >
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving…" : "Save Draft"}
          </Button>
          <Button
            type="submit"
            className="bg-brand-green hover:bg-brand-green/90 text-brand-black"
            disabled={isSubmitting}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving…" : "Schedule Event"}
          </Button>
        </div>
      </form>
    </div>
  );
}
