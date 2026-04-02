export interface CommunityForEdit {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  location: string;
  created_by: string | null;
  created_at: string | null;
}

export type CommunityEditFormFields = {
  name: string;
  description: string;
  imageUrl: string | null;
  location: string;
};
