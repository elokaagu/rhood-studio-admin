export type BrandsSortOption =
  | "date_joined_newest"
  | "date_joined_oldest"
  | "last_active_newest"
  | "last_active_oldest";

export type BrandsAggregateStats = {
  totalBrands: number;
  totalOpportunities: number;
  totalApplications: number;
  totalPending: number;
};

/** Row shown in the admin brands list (already aggregated). */
export type BrandMember = {
  id: string;
  name: string;
  email: string;
  location: string | null;
  joinedDate: string;
  lastActive: string;
  status: "active" | "inactive";
  brandName: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  opportunitiesCount: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  recentOpportunity: string | null;
  recentOpportunityDate: string | null;
};

export type BrandProfileRow = {
  id: string;
  brand_name: string | null;
  first_name: string;
  last_name: string;
  email: string;
  city: string | null;
  created_at: string | null;
  updated_at: string | null;
  bio: string | null;
  profile_image_url: string | null;
};
