"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserProfile, getCurrentUserId } from "@/lib/auth-utils";
import {
  Calendar,
  MapPin,
  Clock,
  Coins,
  Music,
  CheckCircle,
  XCircle,
  Hourglass,
  ArrowRight,
} from "lucide-react";
import { textStyles } from "@/lib/typography";
import { formatDate } from "@/lib/date-utils";

interface BookingRequest {
  id: string;
  dj_id: string;
  event_title: string;
  event_description: string | null;
  event_date: string;
  event_end_time: string;
  location: string;
  payment_amount: number | null;
  payment_currency: string;
  genre: string | null;
  status: "pending" | "accepted" | "declined" | "cancelled";
  dj_response_at: string | null;
  dj_response_notes: string | null;
  created_at: string;
  dj_profile: {
    dj_name: string;
    profile_image_url: string | null;
    city: string;
  } | null;
}

export default function BookingRequestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  const fetchBookingRequests = async () => {
    try {
      setIsLoading(true);
      const userId = await getCurrentUserId();
      if (!userId) return;

      // Determine if user is brand or DJ
      const profile = await getCurrentUserProfile();
      const isBrand = profile?.role === "brand";

      let query = supabase
        .from("booking_requests")
        .select(
          `
          *,
          dj_profile:user_profiles!booking_requests_dj_id_fkey(
            dj_name,
            profile_image_url,
            city
          )
        `
        )
        .order("created_at", { ascending: false });

      if (isBrand) {
        query = query.eq("brand_id", userId);
      } else {
        // DJs see requests sent to them
        query = query.eq("dj_id", userId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setBookingRequests((data as BookingRequest[]) || []);
    } catch (error) {
      console.error("Error fetching booking requests:", error);
      toast({
        title: "Error",
        description: "Failed to load booking requests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchBookingRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            <Hourglass className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case "declined":
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            <XCircle className="h-3 w-3 mr-1" />
            Declined
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="border-gray-500 text-gray-500">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        weekday: "short",
        year: "numeric",
        month: "short",
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
          <p className={textStyles.body.regular}>Loading booking requests...</p>
        </div>
      </div>
    );
  }

  const isBrand = userProfile?.role === "brand";

  return (
    <div className="space-y-4 sm:space-y-6 animate-blur-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div>
          <h1 className={textStyles.headline.section}>
            {isBrand ? "MY BOOKING REQUESTS" : "BOOKING REQUESTS"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {isBrand
              ? "View and manage your booking requests"
              : "View and respond to booking requests"}
          </p>
        </div>
        {isBrand && (
          <Button
            onClick={() => router.push("/admin/book-dj")}
            className="w-full sm:w-auto"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Book a DJ
          </Button>
        )}
      </div>

      {/* Booking Requests List */}
      {bookingRequests.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {isBrand
                ? "You haven't sent any booking requests yet."
                : "You don't have any booking requests yet."}
            </p>
            {isBrand && (
              <Button
                onClick={() => router.push("/admin/book-dj")}
                className="mt-4"
              >
                Book a DJ
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookingRequests.map((request) => (
            <Card
              key={request.id}
              className="bg-card border-border hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {request.event_title}
                      </h3>
                      {isBrand && request.dj_profile && (
                        <p className="text-sm text-muted-foreground mt-1">
                          DJ: {request.dj_profile.dj_name}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatEventDate(request.event_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatEventTime(request.event_date)} -{" "}
                          {formatEventTime(request.event_end_time)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{request.location}</span>
                      </div>
                      {request.payment_amount && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Coins className="h-4 w-4" />
                          <span>
                            {request.payment_currency === "GBP"
                              ? "£"
                              : request.payment_currency === "USD"
                              ? "$"
                              : "€"}
                            {request.payment_amount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {request.genre && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Music className="h-4 w-4" />
                          <span>{request.genre}</span>
                        </div>
                      )}
                    </div>

                    {request.event_description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {request.event_description}
                      </p>
                    )}

                    {request.dj_response_notes && (
                      <div className="p-3 bg-secondary rounded-md">
                        <p className="text-sm font-medium text-foreground mb-1">
                          DJ Response:
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {request.dj_response_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(request.status)}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/admin/booking-requests/${request.id}`)
                      }
                    >
                      View Details
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

