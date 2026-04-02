/** Form state for the brand booking-request flow (book-dj/[djId]/request). */
export interface BookingRequestFormData {
  event_title: string;
  event_description: string;
  event_date: string;
  event_time: string;
  event_end_time: string;
  location: string;
  locationPlaceId: string;
  payment_amount: string;
  payment_currency: string;
  genre: string;
  additional_requirements: string;
  contact_email: string;
  contact_phone: string;
}

/** Fields read from `user_profiles` for the DJ card + notifications. */
export interface DjProfileForBooking {
  id: string;
  email: string | null;
  dj_name: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  city: string | null;
  genres: string[] | null;
  bio: string | null;
}

/** Minimal brand context for notifications (satisfied by `UserProfile` from auth-utils). */
export type BrandContextForBooking = {
  brand_name?: string | null;
};

export type CreateBookingRequestResult =
  | { ok: true; bookingRequestId: string }
  | { ok: false; title: string; message: string };
