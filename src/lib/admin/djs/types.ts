export type DjSortBy =
  | "date_joined_newest"
  | "date_joined_oldest"
  | "last_active_newest"
  | "last_active_oldest";

export type DjStatus = "active" | "inactive";

export type DjMember = {
  id: string;
  name: string;
  email: string;
  location: string;
  joinedDate: string;
  gigs: number;
  rating: number;
  genres: string[];
  status: DjStatus;
  lastActive: string;
  djName: string | null;
  bio: string | null;
  instagram: string | null;
  soundcloud: string | null;
  profileImageUrl: string | null;
};

export type FetchDjsResult =
  | { ok: true; data: DjMember[] }
  | { ok: false; message: string };
