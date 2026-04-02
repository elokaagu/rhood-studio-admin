import { supabase } from "@/integrations/supabase/client";

export type CommunityListItem = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  member_count: number;
  created_at: string | null;
  created_by: string | null;
  creator_name: string;
  creator_avatar: string | null;
};

export type CommunitiesListStats = {
  totalCommunities: number;
  totalMembersPlatform: number;
  activeCommunities: number;
  createdThisMonth: number;
};

type CommunityRowWithCreator = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string | null;
  created_by: string | null;
  creator: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
  } | null;
};

function buildMemberCountMap(
  rows: { community_id: string | null }[] | null
): Record<string, number> {
  if (!rows?.length) return {};
  return rows.reduce<Record<string, number>>((acc, row) => {
    if (row.community_id) {
      acc[row.community_id] = (acc[row.community_id] || 0) + 1;
    }
    return acc;
  }, {});
}

function countCreatedThisMonth(createdAt: string | null): boolean {
  if (!createdAt) return false;
  const createdDate = new Date(createdAt);
  const now = new Date();
  return (
    createdDate.getMonth() === now.getMonth() &&
    createdDate.getFullYear() === now.getFullYear()
  );
}

function mapRowToListItem(
  row: CommunityRowWithCreator,
  memberCountMap: Record<string, number>
): CommunityListItem {
  const creator = row.creator;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    image_url: row.image_url,
    created_at: row.created_at,
    created_by: row.created_by,
    creator_name: creator
      ? `${creator.first_name ?? ""} ${creator.last_name ?? ""}`.trim() ||
        "Admin"
      : "Admin",
    creator_avatar: creator?.profile_image_url ?? null,
    member_count: memberCountMap[row.id] ?? 0,
  };
}

function computeStats(
  communities: CommunityListItem[],
  totalMembersPlatform: number
): CommunitiesListStats {
  let activeCommunities = 0;
  let createdThisMonth = 0;
  for (const c of communities) {
    if (c.member_count > 0) activeCommunities += 1;
    if (countCreatedThisMonth(c.created_at)) createdThisMonth += 1;
  }
  return {
    totalCommunities: communities.length,
    totalMembersPlatform,
    activeCommunities,
    createdThisMonth,
  };
}

export async function fetchCommunitiesListWithStats(): Promise<
  | { ok: true; communities: CommunityListItem[]; stats: CommunitiesListStats }
  | { ok: false; message: string }
> {
  const { data: communitiesData, error: communitiesError } = await supabase
    .from("communities")
    .select(
      `
          *,
          creator:user_profiles!communities_created_by_fkey(
            id,
            first_name,
            last_name,
            profile_image_url
          )
        `
    )
    .order("created_at", { ascending: false });

  if (communitiesError) {
    return { ok: false, message: communitiesError.message };
  }

  const rows = (communitiesData ?? []) as CommunityRowWithCreator[];

  const { data: memberRows, error: memberError } = await supabase
    .from("community_members")
    .select("community_id");

  const memberCountMap = memberError
    ? {}
    : buildMemberCountMap(memberRows ?? null);

  const communities = rows.map((row) => mapRowToListItem(row, memberCountMap));

  const { count: totalUserCount, error: totalUserError } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true });

  const totalMembersPlatform =
    totalUserError || totalUserCount === null ? 0 : totalUserCount;

  return {
    ok: true,
    communities,
    stats: computeStats(communities, totalMembersPlatform),
  };
}
