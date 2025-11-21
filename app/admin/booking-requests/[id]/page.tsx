"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserProfile, getCurrentUserId } from "@/lib/auth-utils";
import {
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Music,
  CheckCircle,
  XCircle,
  Hourglass,
  ArrowLeft,
  User,
} from "lucide-react";
import { textStyles } from "@/lib/typography";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BookingRequest {
  id: string;
  brand_id: string;
  dj_id: string;
  event_title: string;
  event_description: string | null;
  event_date: string;
  event_end_time: string;
  location: string;
  location_place_id: string | null;
  payment_amount: number | null;
  payment_currency: string;
  genre: string | null;
  additional_requirements: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: "pending" | "accepted" | "declined" | "cancelled";
  dj_response_at: string | null;
  dj_response_notes: string | null;
  created_at: string;
  brand_profile: {
    brand_name: string | null;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export default function BookingRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const bookingRequestId = params.id as string;
  const [bookingRequest, setBookingRequest] = useState<BookingRequest | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseType, setResponseType] = useState<"accept" | "decline" | null>(
    null
  );
  const [responseNotes, setResponseNotes] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      const profile = await getCurrentUserProfile();
      if (!profile) {
        router.push("/login");
        return;
      }
      setUserProfile(profile);
    };
    checkUserRole();
  }, [router]);

  const fetchBookingRequest = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("booking_requests")
        .select(
          `
          *,
          brand_profile:user_profiles!booking_requests_brand_id_fkey(
            brand_name,
            first_name,
            last_name,
            email
          )
        `
        )
        .eq("id", bookingRequestId)
        .single();

      if (error) {
        throw error;
      }

      // Check if user has access
      const userId = await getCurrentUserId();
      const isBrand = userProfile?.role === "brand";
      const isDJ = !isBrand;

      if (
        (isBrand && data.brand_id !== userId) ||
        (isDJ && data.dj_id !== userId)
      ) {
        toast({
          title: "Access Denied",
          description: "You don't have access to this booking request.",
          variant: "destructive",
        });
        router.push("/admin/booking-requests");
        return;
      }

      setBookingRequest(data as BookingRequest);
    } catch (error) {
      console.error("Error fetching booking request:", error);
      toast({
        title: "Error",
        description: "Failed to load booking request. Please try again.",
        variant: "destructive",
      });
      router.push("/admin/booking-requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile && bookingRequestId) {
      fetchBookingRequest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, bookingRequestId]);

  const handleResponse = async () => {
    if (!responseType || !bookingRequest) return;

    setIsResponding(true);
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Update booking request
      const { error: updateError } = await supabase
        .from("booking_requests")
        .update({
          status: responseType === "accept" ? "accepted" : "declined",
          dj_response_at: new Date().toISOString(),
          dj_response_notes: responseNotes.trim() || null,
        })
        .eq("id", bookingRequestId);

      if (updateError) {
        throw updateError;
      }

      // Create notification for brand
      try {
        const { createNotification } = await import("@/lib/notifications");
        await createNotification({
          title:
            responseType === "accept"
              ? "✅ Booking Accepted"
              : "❌ Booking Declined",
          message: `DJ ${userProfile?.dj_name || "has"} ${
            responseType === "accept" ? "accepted" : "declined"
          } your booking request for "${bookingRequest.event_title}"`,
          type: `booking_${responseType === "accept" ? "accepted" : "declined"}`,
          user_id: bookingRequest.brand_id,
          related_id: bookingRequestId,
        });
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
      }

      toast({
        title: "Response Sent",
        description: `Booking request ${responseType === "accept" ? "accepted" : "declined"} successfully.`,
      });

      setResponseDialogOpen(false);
      setResponseNotes("");
      fetchBookingRequest();
    } catch (error: any) {
      console.error("Error responding to booking request:", error);
      toast({
        title: "Error",
        description:
          error?.message || "Failed to respond to booking request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResponding(false);
    }
  };

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatEventTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className={textStyles.body.regular}>Loading booking request...</p>
        </div>
      </div>
    );
  }

  if (!bookingRequest) {
    return null;
  }

  const isBrand = userProfile?.role === "brand";
  const isDJ = !isBrand;
  const canRespond = isDJ && bookingRequest.status === "pending";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/booking-requests")}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {bookingRequest.event_title}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Booking Request Details
            </p>
          </div>
        </div>
        {canRespond && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setResponseType("decline");
                setResponseDialogOpen(true);
              }}
              className="flex-1 sm:flex-none"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Decline
            </Button>
            <Button
              onClick={() => {
                setResponseType("accept");
                setResponseDialogOpen(true);
              }}
              className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Event Information */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <p className="text-sm font-medium text-foreground">
                      {formatEventDate(bookingRequest.event_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Time</Label>
                    <p className="text-sm font-medium text-foreground">
                      {formatEventTime(bookingRequest.event_date)} -{" "}
                      {formatEventTime(bookingRequest.event_end_time)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Location</Label>
                    <p className="text-sm font-medium text-foreground">
                      {bookingRequest.location}
                    </p>
                  </div>
                </div>
                {bookingRequest.payment_amount && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label className="text-xs text-muted-foreground">Payment</Label>
                      <p className="text-sm font-medium text-foreground">
                        {bookingRequest.payment_currency === "GBP"
                          ? "£"
                          : bookingRequest.payment_currency === "USD"
                          ? "$"
                          : "€"}
                        {bookingRequest.payment_amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {bookingRequest.genre && (
                  <div className="flex items-center gap-3">
                    <Music className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label className="text-xs text-muted-foreground">Genre</Label>
                      <p className="text-sm font-medium text-foreground">
                        {bookingRequest.genre}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {bookingRequest.event_description && (
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <p className="text-sm text-foreground mt-2">
                    {bookingRequest.event_description}
                  </p>
                </div>
              )}

              {bookingRequest.additional_requirements && (
                <div>
                  <Label className="text-sm text-muted-foreground">
                    Additional Requirements
                  </Label>
                  <p className="text-sm text-foreground mt-2">
                    {bookingRequest.additional_requirements}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {bookingRequest.status === "pending" && (
                  <Hourglass className="h-5 w-5 text-yellow-500" />
                )}
                {bookingRequest.status === "accepted" && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {bookingRequest.status === "declined" && (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span className="text-sm font-medium text-foreground capitalize">
                  {bookingRequest.status}
                </span>
              </div>
              {bookingRequest.dj_response_notes && (
                <div className="mt-4 p-3 bg-secondary rounded-md">
                  <Label className="text-sm font-medium text-foreground">
                    DJ Response:
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {bookingRequest.dj_response_notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Brand/DJ Profile */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                {isBrand ? "DJ" : "Brand"} Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isBrand && bookingRequest.brand_profile && (
                <>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label className="text-xs text-muted-foreground">Brand</Label>
                      <p className="text-sm font-medium text-foreground">
                        {bookingRequest.brand_profile.brand_name ||
                          `${bookingRequest.brand_profile.first_name} ${bookingRequest.brand_profile.last_name}`}
                      </p>
                    </div>
                  </div>
                  {bookingRequest.contact_email && (
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm text-foreground">
                        {bookingRequest.contact_email}
                      </p>
                    </div>
                  )}
                  {bookingRequest.contact_phone && (
                    <div className="flex items-center gap-3">
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="text-sm text-foreground">
                        {bookingRequest.contact_phone}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {responseType === "accept" ? "Accept" : "Decline"} Booking Request
            </DialogTitle>
            <DialogDescription>
              {responseType === "accept"
                ? "Confirm that you want to accept this booking request. You can add optional notes."
                : "Are you sure you want to decline this booking request? You can add optional notes."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="response-notes">Response Notes (Optional)</Label>
              <Textarea
                id="response-notes"
                placeholder={
                  responseType === "accept"
                    ? "Add any notes or questions for the brand..."
                    : "Let the brand know why you're declining..."
                }
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                className="bg-secondary border-border text-foreground min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResponseDialogOpen(false);
                setResponseNotes("");
                setResponseType(null);
              }}
              disabled={isResponding}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResponse}
              disabled={isResponding}
              className={
                responseType === "accept"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isResponding
                ? "Processing..."
                : responseType === "accept"
                ? "Accept Booking"
                : "Decline Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

