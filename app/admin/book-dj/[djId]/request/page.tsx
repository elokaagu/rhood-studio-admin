"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserProfile, getCurrentUserId } from "@/lib/auth-utils";
import LocationAutocomplete from "@/components/location-autocomplete";
import {
  Calendar,
  MapPin,
  Clock,
  Music,
  DollarSign,
  ArrowLeft,
  Send,
  Star,
  X,
} from "lucide-react";
import { textStyles } from "@/lib/typography";

export default function BookingRequestPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const djId = params.djId as string;
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [djProfile, setDjProfile] = useState<any>(null);
  const [brandProfile, setBrandProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    event_title: "",
    event_description: "",
    event_date: "",
    event_time: "",
    event_end_time: "",
    location: "",
    locationPlaceId: "",
    payment_amount: "",
    payment_currency: "GBP",
    genre: "",
    additional_requirements: "",
    contact_email: "",
    contact_phone: "",
  });

  // Fetch DJ profile
  useEffect(() => {
    const fetchDJProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", djId)
          .single();

        if (error) {
          throw error;
        }

        setDjProfile(data);
      } catch (error) {
        console.error("Error fetching DJ profile:", error);
        toast({
          title: "Error",
          description: "Failed to load DJ profile. Please try again.",
          variant: "destructive",
        });
        router.push("/admin/book-dj");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchBrandProfile = async () => {
      const profile = await getCurrentUserProfile();
      if (profile?.role !== "brand") {
        toast({
          title: "Access Denied",
          description: "This page is only available for brand accounts.",
          variant: "destructive",
        });
        router.push("/admin/dashboard");
        return;
      }
      setBrandProfile(profile);
    };

    if (djId) {
      fetchDJProfile();
      fetchBrandProfile();
    }
  }, [djId, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!formData.event_title.trim()) {
        toast({
          title: "Missing Title",
          description: "Please provide an event title.",
          variant: "destructive",
        });
        return;
      }

      if (!formData.event_date || !formData.event_time || !formData.event_end_time) {
        toast({
          title: "Missing Schedule",
          description: "Please provide event date, start time, and end time.",
          variant: "destructive",
        });
        return;
      }

      if (!formData.location.trim()) {
        toast({
          title: "Missing Location",
          description: "Please provide an event location.",
          variant: "destructive",
        });
        return;
      }

      const brandUserId = await getCurrentUserId();
      if (!brandUserId) {
        toast({
          title: "Authentication Error",
          description: "Please log in to submit a booking request.",
          variant: "destructive",
        });
        return;
      }

      // Combine date and time
      const eventStart = new Date(`${formData.event_date}T${formData.event_time}`);
      const eventEnd = new Date(`${formData.event_date}T${formData.event_end_time}`);

      if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
        toast({
          title: "Invalid Time",
          description: "Please enter valid start and end times.",
          variant: "destructive",
        });
        return;
      }

      if (eventEnd <= eventStart) {
        toast({
          title: "Invalid Schedule",
          description: "End time must be after start time.",
          variant: "destructive",
        });
        return;
      }

      // Parse payment amount
      const paymentAmount = formData.payment_amount
        ? parseFloat(formData.payment_amount.replace(/[£,]/g, ""))
        : null;

      // Create booking request
      const { data: bookingRequest, error: insertError } = await supabase
        .from("booking_requests")
        .insert({
          brand_id: brandUserId,
          dj_id: djId,
          event_title: formData.event_title.trim(),
          event_description: formData.event_description.trim() || null,
          event_date: eventStart.toISOString(),
          event_end_time: eventEnd.toISOString(),
          location: formData.location.trim(),
          location_place_id: formData.locationPlaceId || null,
          payment_amount: paymentAmount,
          payment_currency: formData.payment_currency,
          genre: formData.genre || null,
          additional_requirements: formData.additional_requirements.trim() || null,
          contact_email: formData.contact_email.trim() || null,
          contact_phone: formData.contact_phone.trim() || null,
          status: "pending",
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Send email notification to DJ
      try {
        const response = await fetch("/api/notifications/booking-request", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            djEmail: djProfile.email,
            djName: djProfile.dj_name || `${djProfile.first_name} ${djProfile.last_name}`,
            brandName: brandProfile?.brand_name || "A Brand",
            eventTitle: formData.event_title,
            eventDate: eventStart.toISOString(),
            eventEndTime: eventEnd.toISOString(),
            location: formData.location,
            paymentAmount: paymentAmount,
            paymentCurrency: formData.payment_currency,
            bookingRequestId: bookingRequest.id,
          }),
        });

        if (!response.ok) {
          console.error("Failed to send email notification");
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Don't fail the booking request if email fails
      }

      // Create in-app notification for DJ
      try {
        const { createNotification } = await import("@/lib/notifications");
        await createNotification({
          title: "🎵 New Booking Request",
          message: `${brandProfile?.brand_name || "A brand"} wants to book you for "${formData.event_title}"`,
          type: "booking_request",
          user_id: djId,
          related_id: bookingRequest.id,
        });
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
        // Don't fail the booking request if notification fails
      }

      toast({
        title: "Booking Request Sent",
        description: "Your booking request has been sent to the DJ. They will be notified via email and in-app notification.",
      });

      router.push("/admin/book-dj");
    } catch (error: any) {
      console.error("Error creating booking request:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to submit booking request. Please try again.",
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
          <p className={textStyles.body.regular}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!djProfile) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/book-dj")}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Book {djProfile.dj_name || "DJ"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Fill in the event details to send a booking request
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DJ Profile Card */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border sticky top-4">
            <CardHeader>
              <CardTitle className="text-foreground">DJ Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={djProfile.profile_image_url || "/person1.jpg"}
                    alt={djProfile.dj_name}
                  />
                  <AvatarFallback>
                    {djProfile.dj_name?.charAt(0).toUpperCase() || "D"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {djProfile.dj_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {djProfile.city}
                    </span>
                  </div>
                </div>
              </div>

              {djProfile.genres && djProfile.genres.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Genres</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {djProfile.genres.map((genre: string) => (
                      <Badge
                        key={genre}
                        variant="outline"
                        className="text-xs border-border text-foreground"
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {djProfile.bio && (
                <div>
                  <Label className="text-sm text-muted-foreground">Bio</Label>
                  <p className="text-sm text-foreground mt-1">{djProfile.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="event_title" className="text-foreground">
                    Event Title *
                  </Label>
                  <Input
                    id="event_title"
                    placeholder="e.g., Summer Festival 2024"
                    value={formData.event_title}
                    onChange={(e) =>
                      setFormData({ ...formData, event_title: e.target.value })
                    }
                    className="bg-secondary border-border text-foreground"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_description" className="text-foreground">
                    Event Description
                  </Label>
                  <Textarea
                    id="event_description"
                    placeholder="Describe the event, atmosphere, and what you're looking for..."
                    value={formData.event_description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        event_description: e.target.value,
                      })
                    }
                    className="bg-secondary border-border text-foreground min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="event_date"
                      className="text-foreground flex items-center"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Event Date *
                    </Label>
                    <Input
                      id="event_date"
                      type="date"
                      value={formData.event_date}
                      onChange={(e) =>
                        setFormData({ ...formData, event_date: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground"
                      required
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genre" className="text-foreground flex items-center">
                      <Music className="h-4 w-4 mr-2" />
                      Genre
                    </Label>
                    <Input
                      id="genre"
                      placeholder="e.g., House, Techno"
                      value={formData.genre}
                      onChange={(e) =>
                        setFormData({ ...formData, genre: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="event_time"
                      className="text-foreground flex items-center"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Start Time *
                    </Label>
                    <Input
                      id="event_time"
                      type="time"
                      value={formData.event_time}
                      onChange={(e) =>
                        setFormData({ ...formData, event_time: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="event_end_time"
                      className="text-foreground flex items-center"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      End Time *
                    </Label>
                    <Input
                      id="event_end_time"
                      type="time"
                      value={formData.event_end_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          event_end_time: e.target.value,
                        })
                      }
                      className="bg-secondary border-border text-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-foreground flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Location *
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_amount" className="text-foreground flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Payment Amount
                    </Label>
                    <Input
                      id="payment_amount"
                      placeholder="e.g., 500"
                      value={formData.payment_amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment_amount: e.target.value,
                        })
                      }
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_currency" className="text-foreground">
                      Currency
                    </Label>
                    <Select
                      value={formData.payment_currency}
                      onValueChange={(value) =>
                        setFormData({ ...formData, payment_currency: value })
                      }
                    >
                      <SelectTrigger className="bg-secondary border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem
                          value="GBP"
                          className="text-foreground hover:bg-accent"
                        >
                          GBP (£)
                        </SelectItem>
                        <SelectItem
                          value="USD"
                          className="text-foreground hover:bg-accent"
                        >
                          USD ($)
                        </SelectItem>
                        <SelectItem
                          value="EUR"
                          className="text-foreground hover:bg-accent"
                        >
                          EUR (€)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="additional_requirements" className="text-foreground">
                    Additional Requirements
                  </Label>
                  <Textarea
                    id="additional_requirements"
                    placeholder="Equipment needed, experience level, etc."
                    value={formData.additional_requirements}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        additional_requirements: e.target.value,
                      })
                    }
                    className="bg-secondary border-border text-foreground min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email" className="text-foreground">
                      Contact Email
                    </Label>
                    <Input
                      id="contact_email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.contact_email}
                      onChange={(e) =>
                        setFormData({ ...formData, contact_email: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone" className="text-foreground">
                      Contact Phone
                    </Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      placeholder="+44 20 1234 5678"
                      value={formData.contact_phone}
                      onChange={(e) =>
                        setFormData({ ...formData, contact_phone: e.target.value })
                      }
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/book-dj")}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
                disabled={isSubmitting}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? "Sending..." : "Send Booking Request"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

