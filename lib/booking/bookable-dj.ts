/**
 * DJ row shaped for the brand "Book a DJ" discovery page.
 * Enrichment (ratings, mixes, availability) is computed in fetchBookableDjs.
 */
export interface BookableDJ {
  id: string;
  dj_name: string;
  first_name: string;
  last_name: string;
  email: string;
  city: string;
  genres: string[];
  bio: string | null;
  instagram: string | null;
  soundcloud: string | null;
  profile_image_url: string | null;
  rating: number;
  mixCount: number;
  credits: number;
  latestMix: {
    id: string;
    title: string;
    genre: string;
    file_url: string;
    description?: string | null;
  } | null;
  /** Heuristic from upcoming booking_requests count (see fetchBookableDjs). */
  availability: "available" | "busy";
}
