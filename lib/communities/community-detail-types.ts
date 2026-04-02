/** Community row as shown on the admin detail page (includes creator join). */
export type CommunityDetail = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  member_count: number | null;
  created_at: string | null;
  created_by: string | null;
  creator_name?: string;
  creator_avatar?: string | null;
};

export type CommunityChatMessage = {
  id: string;
  content: string;
  created_at: string | null;
  community_id?: string | null;
  author_id: string | null;
  sender_name?: string;
  sender_avatar?: string | null;
  is_pinned?: boolean;
  media_url?: string | null;
};

export type CommunityMemberView = {
  id: string;
  user_id: string | null;
  role: string | null;
  joined_at: string | null;
  user_name?: string;
  user_avatar?: string | null;
};

export type PrivateChatSummary = {
  id: string;
  name: string;
  description: string | null;
  community_id: string;
  created_by: string;
  created_at: string;
  member_count?: number;
};

export type UserOptionForCommunity = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  dj_name: string | null;
  brand_name: string | null;
  email: string | null;
  profile_image_url: string | null;
};
