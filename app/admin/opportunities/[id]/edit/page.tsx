"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

export default function EditOpportunityPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const opportunityId = params.id;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

        setFormData({
          title: data.title || "",
          description: data.description || "",
          location: data.location || "",
          date: dateStr,
          time: timeStr,
          pay: data.payment ? data.payment.toString() : "",
          genre: data.genre || "",
          requirements: data.skill_level || "",
          additionalInfo: "",
          status: data.is_active ? "active" : "draft",
          imageUrl: data.image_url || "",
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
          pay: "£300",
          applicants: 12,
          status: "active",
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
          pay: "£450",
          applicants: 8,
          status: "active",
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
          pay: "£200 + Residency",
          applicants: 15,
          status: "completed",
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
        description: opportunity?.description || "",
        location: opportunity?.location || "",
        date: opportunity?.date || "",
        time: "",
        pay: opportunity?.pay || "",
        genre: opportunity?.genre || "",
        requirements: opportunity?.requirements || "",
        additionalInfo: opportunity?.additionalInfo || "",
        status: opportunity?.status || "draft",
        imageUrl: "",
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
    date: "",
    time: "",
    pay: "",
    genre: "",
    requirements: "",
    additionalInfo: "",
    status: "draft",
    imageUrl: "",
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
      // Combine date and time into event_date
      const eventDate =
        formData.date && formData.time
          ? new Date(`${formData.date}T${formData.time}`).toISOString()
          : formData.date
          ? new Date(formData.date).toISOString()
          : null;

      // Parse payment amount
      const paymentAmount = formData.pay
        ? parseFloat(formData.pay.replace(/[£,]/g, ""))
        : null;

      const { error } = await supabase
        .from("opportunities")
        .update({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          event_date: eventDate,
          payment: paymentAmount,
          genre: formData.genre,
          skill_level: formData.requirements,
          is_active: formData.status === "active",
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
      const eventDate =
        formData.date && formData.time
          ? new Date(`${formData.date}T${formData.time}`).toISOString()
          : formData.date
          ? new Date(formData.date).toISOString()
          : null;

      const paymentAmount = formData.pay
        ? parseFloat(formData.pay.replace(/[£,]/g, ""))
        : null;

      const { error } = await supabase
        .from("opportunities")
        .update({
          title: formData.title,
          description: formData.description,
          location: formData.location,
          event_date: eventDate,
          payment: paymentAmount,
          genre: formData.genre,
          skill_level: formData.requirements,
          is_active: false, // Draft is not active
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
              <Label htmlFor="description" className={textStyles.body.regular}>
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the event, atmosphere, and what you're looking for..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-secondary border-border text-foreground min-h-[100px]"
                required
              />
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
                <Input
                  id="location"
                  placeholder="e.g., East London Warehouse"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="bg-secondary border-border text-foreground"
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className={textStyles.body.regular}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Date
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
    </div>
  );
}
