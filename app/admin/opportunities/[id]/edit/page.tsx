"use client";

import React, { useState } from "react";
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
import {
  Calendar,
  MapPin,
  DollarSign,
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
  const opportunityId = params.id;

  // Mock data - in a real app, this would be fetched from an API
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

  const [formData, setFormData] = useState({
    title: opportunity?.title || "",
    description: opportunity?.description || "",
    location: opportunity?.location || "",
    date: opportunity?.date || "",
    pay: opportunity?.pay || "",
    genre: opportunity?.genre || "",
    requirements: opportunity?.requirements || "",
    additionalInfo: opportunity?.additionalInfo || "",
    status: opportunity?.status || "draft",
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Updating opportunity:", formData);
    router.push(`/admin/opportunities/${opportunityId}`);
  };

  const handleSaveDraft = () => {
    console.log("Saving draft:", { ...formData, status: "draft" });
    router.push(`/admin/opportunities/${opportunityId}`);
  };

  if (!opportunity) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className={textStyles.headline.section}>OPPORTUNITY NOT FOUND</h1>
          <p className={textStyles.body.regular}>
            The opportunity you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button
            onClick={() => router.push("/admin/opportunities")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Opportunities
          </Button>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="location"
                  className={textStyles.body.regular}
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
                <Label htmlFor="pay" className={textStyles.body.regular}>
                  <DollarSign className="h-4 w-4 mr-2" />
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
              <Label htmlFor="additionalInfo" className={textStyles.body.regular}>
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
          <Button type="button" variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button type="submit" className="bg-brand-green hover:bg-brand-green/90 text-brand-black">
            <Save className="h-4 w-4 mr-2" />
            Update Opportunity
          </Button>
        </div>
      </form>
    </div>
  );
}
