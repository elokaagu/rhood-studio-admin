import { supabase } from "@/integrations/supabase/client";
import type {
  CommunityDetail,
  CommunityChatMessage,
  CommunityMemberView,
  PrivateChatSummary,
  UserOptionForCommunity,
} from "./community-detail-types";

type Result<T = void> =
  | { ok: true; data?: T }
  | { ok: false; message: string; code?: string };

/** Typed accessor for tables not in generated Supabase types. */
function fromUntyped(table: string) {
  return supabase.from(table as never);
}

export async function fetchCommunityDetail(
  communityId: string
): Promise<{ ok: true; community: CommunityDetail } | { ok: false; message: string }> {
  const { data, error } = await supabase
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
    .eq("id", communityId)
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message || "Not found" };
  }

  const row = data as CommunityDetail & {
    creator?: {
      first_name?: string;
      last_name?: string;
      profile_image_url?: string | null;
    } | null;
  };

  const { creator, ...rest } = row;
  const community: CommunityDetail = {
    ...(rest as CommunityDetail),
    creator_name: creator
      ? `${creator.first_name ?? ""} ${creator.last_name ?? ""}`.trim() ||
        "Admin"
      : "Admin",
    creator_avatar: creator?.profile_image_url ?? null,
  };

  return { ok: true, community };
}

export async function fetchCommunityMessages(
  communityId: string,
  selectedPrivateChatId: string | null
): Promise<CommunityChatMessage[]> {
  let query = supabase.from("community_posts").select(
    `
        *,
        author:user_profiles!community_posts_author_id_fkey(
          id,
          first_name,
          last_name,
          profile_image_url
        )
      `
  );

  if (selectedPrivateChatId) {
    query = query.eq("private_chat_id", selectedPrivateChatId);
  } else {
    query = query.eq("community_id", communityId).is("private_chat_id", null);
  }

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((message) => {
    const author = (
      message as unknown as {
        author?: {
          first_name?: string;
          last_name?: string;
          profile_image_url?: string | null;
        };
      }
    ).author;

    return {
      id: message.id,
      content: message.content,
      created_at: message.created_at,
      community_id: message.community_id,
      author_id: message.author_id,
      is_pinned: (message as { is_pinned?: boolean }).is_pinned,
      media_url: (message as { media_url?: string | null }).media_url,
      sender_name: author
        ? `${author.first_name ?? ""} ${author.last_name ?? ""}`.trim() ||
          "Unknown"
        : "Unknown",
      sender_avatar: author?.profile_image_url ?? null,
    };
  });
}

export async function fetchCommunityMembers(
  communityId: string
): Promise<CommunityMemberView[]> {
  const { data, error } = await supabase
    .from("community_members")
    .select(
      `
        *,
        user:user_profiles!community_members_user_id_fkey(
          id,
          first_name,
          last_name,
          profile_image_url
        )
      `
    )
    .eq("community_id", communityId)
    .order("joined_at", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map((member) => ({
    ...member,
    user_name: member.user
      ? `${member.user.first_name} ${member.user.last_name}`
      : "Unknown",
    user_avatar: member.user?.profile_image_url ?? null,
  })) as CommunityMemberView[];
}

export async function fetchPrivateChatsForUser(
  communityId: string,
  userId: string
): Promise<PrivateChatSummary[]> {
  const { data: memberChats, error: memberError } = await fromUntyped(
    "private_chat_members"
  )
    .select("private_chat_id")
    .eq("user_id", userId);

  if (memberError || !memberChats?.length) {
    return [];
  }

  const chatIds = (memberChats as { private_chat_id: string }[]).map(
    (m) => m.private_chat_id
  );

  const { data, error } = await fromUntyped("private_chats")
    .select("*")
    .eq("community_id", communityId)
    .in("id", chatIds)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const chats = data as PrivateChatSummary[];
  if (chats.length === 0) return [];

  const ids = chats.map((c) => c.id);
  const { data: countRows } = await fromUntyped("private_chat_members")
    .select("private_chat_id")
    .in("private_chat_id", ids);

  const countByChat = new Map<string, number>();
  for (const row of (countRows || []) as { private_chat_id: string }[]) {
    const id = row.private_chat_id;
    countByChat.set(id, (countByChat.get(id) ?? 0) + 1);
  }

  return chats.map((c) => ({
    ...c,
    member_count: countByChat.get(c.id) ?? 0,
  }));
}

export async function fetchUsersAvailableForCommunity(
  memberUserIds: string[]
): Promise<UserOptionForCommunity[]> {
  const { data: allUsers, error } = await supabase
    .from("user_profiles")
    .select(
      "id, first_name, last_name, dj_name, brand_name, email, profile_image_url"
    )
    .order("first_name", { ascending: true });

  if (error || !allUsers) {
    return [];
  }

  const exclude = new Set(memberUserIds.filter(Boolean));
  return (allUsers as UserOptionForCommunity[]).filter((u) => !exclude.has(u.id));
}

export async function syncCommunityMemberCount(
  communityId: string
): Promise<void> {
  const { count } = await supabase
    .from("community_members")
    .select("*", { count: "exact", head: true })
    .eq("community_id", communityId);

  if (count !== null) {
    await supabase
      .from("communities")
      .update({ member_count: count })
      .eq("id", communityId);
  }
}

export async function addCommunityMember(
  communityId: string,
  userId: string
): Promise<Result> {
  const { error } = await supabase.from("community_members").insert([
    {
      community_id: communityId,
      user_id: userId,
      role: "member",
    },
  ]);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: "This user is already a member.", code: "duplicate" };
    }
    return { ok: false, message: error.message };
  }

  await syncCommunityMemberCount(communityId);
  return { ok: true };
}

export async function removeCommunityMember(
  communityId: string,
  membershipRowId: string
): Promise<Result> {
  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("id", membershipRowId)
    .eq("community_id", communityId);

  if (error) {
    return { ok: false, message: error.message };
  }

  await syncCommunityMemberCount(communityId);
  return { ok: true };
}

/**
 * Sends a community or private-chat post. Requires a real authenticated user
 * (no random profile fallback).
 */
export async function sendCommunityPost(params: {
  communityId: string;
  selectedPrivateChatId: string | null;
  content: string;
  authorId: string;
}): Promise<Result> {
  const insertPayload = {
    content: params.content.trim(),
    author_id: params.authorId,
    community_id: params.selectedPrivateChatId ? null : params.communityId,
    private_chat_id: params.selectedPrivateChatId ?? null,
  };

  /* private_chat_id exists in DB but may be absent from generated Insert — satisfy .insert() */
  const { error } = await supabase
    .from("community_posts")
    .insert(insertPayload as never);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function deleteCommunityCascade(
  communityId: string
): Promise<Result> {
  const { error: membersError } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId);

  if (membersError) {
    /* continue — same as legacy page */
  }

  const { error } = await supabase
    .from("communities")
    .delete()
    .eq("id", communityId);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function createPrivateChatWithMembers(params: {
  communityId: string;
  currentUserId: string;
  name: string;
  description: string | null;
  memberUserIds: string[];
}): Promise<Result<{ chatId: string }>> {
  const { data: chat, error: chatError } = await fromUntyped("private_chats")
    .insert({
      name: params.name.trim(),
      description: params.description?.trim() || null,
      community_id: params.communityId,
      created_by: params.currentUserId,
    })
    .select()
    .single();

  if (chatError || !chat) {
    return { ok: false, message: chatError?.message || "Failed to create chat" };
  }

  const chatRow = chat as { id: string };

  const membersToAdd = [
    {
      private_chat_id: chatRow.id,
      user_id: params.currentUserId,
      added_by: params.currentUserId,
    },
    ...params.memberUserIds.map((userId) => ({
      private_chat_id: chatRow.id,
      user_id: userId,
      added_by: params.currentUserId,
    })),
  ];

  const { error: membersError } = await fromUntyped("private_chat_members").insert(
    membersToAdd
  );

  if (membersError) {
    return { ok: false, message: membersError.message };
  }

  return { ok: true, data: { chatId: chatRow.id } };
}
