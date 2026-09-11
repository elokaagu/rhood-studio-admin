"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUserProfile, type UserProfile } from "@/lib/auth-utils";
import {
  getBookingRequestsForUser,
  type BookingRequestListRow,
} from "@/lib/booking/fetch-booking-requests-list";
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
  Trash2,
} from "lucide-react";
import { textStyles } from "@/lib/typography";
import { formatBookingEventDate, formatTimeRange } from "@/lib/date-utils";
import { deleteBookingRequest } from "@/lib/booking/delete-booking-request";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BookingRequestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [bookingRequests, setBookingRequests] = useState<BookingRequestListRow[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadProfileAndRequests() {
    try {
      setIsLoading(true);
      const profile = await getCurrentUserProfile();
      if (!profile) {
        router.push("/login");
        return;
      }
      setUserProfile(profile);

      const result = await getBookingRequestsForUser(profile.id, profile.role);

      if (!result.ok) {
        toast({
          title: "Error",
          description: result.message || "Failed to load booking requests.",
          variant: "destructive",
        });
        setBookingRequests([]);
        return;
      }

      setBookingRequests(result.data);
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
  }

  useEffect(() => {
    loadProfileAndRequests();
  }, [router]);

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

  const confirmDeleteRequest = async () => {
    if (!requestToDelete) return;
    try {
      setIsDeleting(true);
      const result = await deleteBookingRequest(requestToDelete.id);
      if (!result.ok) {
        throw new Error(result.message);
      }
      setBookingRequests((prev) =>
        prev.filter((request) => request.id !== requestToDelete.id)
      );
      toast({
        title: "Booking request deleted",
        description: `"${requestToDelete.title}" has been deleted.`,
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Failed to delete booking request.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
      setRequestToDelete(null);
    }
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
                        <span>{formatBookingEventDate(request.event_date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatTimeRange(
                            request.event_date,
                            request.event_end_time
                          )}
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-400"
                      onClick={() => {
                        setRequestToDelete({
                          id: request.id,
                          title: request.event_title,
                        });
                        setDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`${textStyles.subheading.large} text-brand-white`}>
              Delete booking request
            </DialogTitle>
            <DialogDescription className={textStyles.body.regular}>
              Are you sure you want to delete &quot;{requestToDelete?.title}&quot;? This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setRequestToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDeleteRequest()}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

