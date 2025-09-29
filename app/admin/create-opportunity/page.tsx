"use client";

import React, { useState } from "react";
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
import { Calendar, MapPin, Music, Save, X, Plus } from "lucide-react";

export default function CreateOpportunityPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(true);

    try {
      // Check if opportunities table exists first
      const { error: tableCheckError } = await supabase
        .from("opportunities")
        .select("id")
        .limit(1);

      if (tableCheckError) {
        if (tableCheckError.message?.includes("relation") && tableCheckError.message?.includes("does not exist")) {
          toast({
            title: "Database Setup Required",
            description: "Opportunities table doesn't exist. Please create it in Supabase dashboard first.",
            variant: "destructive",
          });
          return;
        }
        throw tableCheckError;
      }

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

      const { error } = await supabase.from("opportunities").insert({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        event_date: eventDate,
        payment: paymentAmount,
        genre: selectedGenres[0] || formData.genre, // Use first selected genre or form genre
        skill_level: formData.requirements,
        organizer_name: "R/HOOD Studio", // Default organizer
        is_active: true,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Opportunity created successfully!",
      });

      router.push("/admin/opportunities");
    } catch (error) {
      console.error("Error creating opportunity:", error);
      toast({
        title: "Error",
        description: "Failed to create opportunity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);

    try {
      // Check if opportunities table exists first
      const { error: tableCheckError } = await supabase
        .from("opportunities")
        .select("id")
        .limit(1);

      if (tableCheckError) {
        if (tableCheckError.message?.includes("relation") && tableCheckError.message?.includes("does not exist")) {
          toast({
            title: "Database Setup Required",
            description: "Opportunities table doesn't exist. Please create it in Supabase dashboard first.",
            variant: "destructive",
          });
          return;
        }
        throw tableCheckError;
      }

      const eventDate =
        formData.date && formData.time
          ? new Date(`${formData.date}T${formData.time}`).toISOString()
          : formData.date
          ? new Date(formData.date).toISOString()
          : null;

      const paymentAmount = formData.pay
        ? parseFloat(formData.pay.replace(/[£,]/g, ""))
        : null;

      const { error } = await supabase.from("opportunities").insert({
        title: formData.title,
        description: formData.description,
        location: formData.location,
        event_date: eventDate,
        payment: paymentAmount,
        genre: selectedGenres[0] || formData.genre,
        skill_level: formData.requirements,
        organizer_name: "R/HOOD Studio",
        is_active: false, // Draft is not active
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Draft Saved",
        description: "Opportunity saved as draft successfully!",
      });

      router.push("/admin/opportunities");
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Create Opportunity
          </h1>
          <p className="text-muted-foreground">Post a new DJ opportunity</p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/opportunities")}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label htmlFor="description" className="text-foreground">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="location"
                  className="text-foreground flex items-center"
                >
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
                <Label htmlFor="pay" className="text-foreground">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="date"
                  className="text-foreground flex items-center"
                >
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
                <Label htmlFor="time" className="text-foreground">
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  className="bg-secondary border-border text-foreground"
                />
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
            className="bg-primary hover:bg-primary/90"
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isSubmitting ? "Creating..." : "Create Opportunity"}
          </Button>
        </div>
      </form>
    </div>
  );
}
