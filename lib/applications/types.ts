export type ApplicationStatus = "pending" | "approved" | "rejected" | string;

export interface ApplicantInfo {
  name: string;
  avatar: string;
  location: string;
  genres: string[];
  email: string;
  bio: string;
  instagram: string | null;
  soundcloud: string | null;
}

export interface ApplicationDetails {
  id: string;
  applicant: ApplicantInfo;
  opportunity: string;
  opportunityId: string | null;
  appliedDate: string;
  status: ApplicationStatus;
  coverLetter: string;
  userId: string | null;
  gigCompleted: boolean;
  organizerId: string | null;
}

export interface UserMix {
  id: string;
  file_url: string | null;
}

export interface BrandRating {
  stars: number;
  comment: string | null;
}

export interface ApplicationDetailsResult {
  application: ApplicationDetails | null;
  userMix: UserMix | null;
  currentUserRole: string | null;
  existingBrandRating: BrandRating | null;
  usedDemoFallback: boolean;
}

export type ApplicationSourceType = "simple" | "form_response";

export interface ApplicationListApplicant {
  name: string;
  djName: string;
  avatar: string;
  location: string;
  genres: string[];
}

export interface ApplicationListItem {
  id: string;
  type: ApplicationSourceType;
  applicant: ApplicationListApplicant;
  opportunity: string;
  opportunityId: string | null;
  appliedDate: string;
  appliedAt: string | null;
  status: ApplicationStatus;
  portfolio: string;
  message: string;
  userId: string | null;
  gig_completed?: boolean;
}

export interface ListPortalApplicationsParams {
  opportunityId: string | null;
}

export interface ListPortalApplicationsResult {
  applications: ApplicationListItem[];
  usedDemoFallback: boolean;
}
