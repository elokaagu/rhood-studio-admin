export type DjMembershipStatus = "pending" | "approved" | "rejected";

export type DjMembershipSource =
  | "invite"
  | "invite_code"
  | "application"
  | "existing"
  | "staff";

export type DjApplication = {
  id: string;
  name: string;
  djName: string | null;
  email: string;
  city: string | null;
  genres: string[];
  bio: string | null;
  profileImageUrl: string | null;
  instagram: string | null;
  soundcloud: string | null;
  appliedAt: string;
  appliedAtLabel: string;
  membershipStatus: DjMembershipStatus;
  membershipSource: DjMembershipSource | null;
  reviewedAt: string | null;
};

export type FetchDjApplicationsResult =
  | { ok: true; data: DjApplication[]; schemaReady: boolean }
  | { ok: false; message: string; schemaReady?: boolean };
