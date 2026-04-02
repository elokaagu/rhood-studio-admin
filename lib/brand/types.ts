export interface BrandProfile {
  id: string;
  brand_name: string | null;
  brand_description: string | null;
  website: string | null;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string | null;
}

export interface BrandAcceptedContract {
  id: string;
  event_title: string;
  event_date: string;
  location: string;
  payment_amount: number | null;
  payment_currency: string;
  status: string;
  dj_profile: {
    dj_name: string;
    profile_image_url: string | null;
  } | null;
}

export type BrandProfileFormFields = {
  brand_name: string;
  brand_description: string;
  website: string;
};
