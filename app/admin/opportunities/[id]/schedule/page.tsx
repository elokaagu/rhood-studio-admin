"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { textStyles } from "@/lib/typography";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Save,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

export default function ScheduleEventPage() {
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
    eventDate: opportunity?.date || "",
    startTime: "20:00",
    endTime: "02:00",
    venue: opportunity?.location || "",
    capacity: "200",
    setupTime: "18:00",
    soundcheckTime: "19:00",
    notes: "",
    status: "scheduled",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Scheduling event:", formData);
    router.push(`/admin/opportunities/${opportunityId}`);
  };

  const handleSaveDraft = () => {
    console.log("Saving draft schedule:", { ...formData, status: "draft" });
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
            <h1 className={textStyles.headline.section}>SCHEDULE EVENT</h1>
            <p className={textStyles.body.regular}>
              Schedule event details for {opportunity.title}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Schedule */}
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
                  <Calendar className="h-4 w-4 mr-2" />
                  Event Date
                </Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) =>
                    setFormData({ ...formData, eventDate: e.target.value })
                  }
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue" className={textStyles.body.regular}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Venue
                </Label>
                <Input
                  id="venue"
                  placeholder="Event venue"
                  value={formData.venue}
                  onChange={(e) =>
                    setFormData({ ...formData, venue: e.target.value })
                  }
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className={textStyles.body.regular}>
                  <Clock className="h-4 w-4 mr-2" />
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  className="bg-secondary border-border text-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className={textStyles.body.regular}>
                  <Clock className="h-4 w-4 mr-2" />
                  End Time
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
          </CardContent>
        </Card>

        {/* Setup Details */}
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
                  <Clock className="h-4 w-4 mr-2" />
                  Setup Time
                </Label>
                <Input
                  id="setupTime"
                  type="time"
                  value={formData.setupTime}
                  onChange={(e) =>
                    setFormData({ ...formData, setupTime: e.target.value })
                  }
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="soundcheckTime" className={textStyles.body.regular}>
                  <Clock className="h-4 w-4 mr-2" />
                  Soundcheck Time
                </Label>
                <Input
                  id="soundcheckTime"
                  type="time"
                  value={formData.soundcheckTime}
                  onChange={(e) =>
                    setFormData({ ...formData, soundcheckTime: e.target.value })
                  }
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity" className={textStyles.body.regular}>
                  <Users className="h-4 w-4 mr-2" />
                  Capacity
                </Label>
                <Input
                  id="capacity"
                  placeholder="200"
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

        {/* Additional Information */}
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
                    value="scheduled"
                    className="text-foreground hover:bg-accent"
                  >
                    Scheduled
                  </SelectItem>
                  <SelectItem
                    value="confirmed"
                    className="text-foreground hover:bg-accent"
                  >
                    Confirmed
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
            <CheckCircle className="h-4 w-4 mr-2" />
            Schedule Event
          </Button>
        </div>
      </form>
    </div>
  );
}
