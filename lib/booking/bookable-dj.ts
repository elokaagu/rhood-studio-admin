/** Prefer DJ name, then full name, then email. */
export function bookableDjDisplayName(dj: {
  dj_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}): string {
  const djName = dj.dj_name?.trim();
  if (djName) return djName;
  const full = `${dj.first_name?.trim() ?? ""} ${dj.last_name?.trim() ?? ""}`.trim();
  if (full) return full;
  const email = dj.email?.trim();
  if (email) return email;
  return "DJ";
}

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
