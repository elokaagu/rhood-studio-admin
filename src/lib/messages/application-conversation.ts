import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserProfile } from "@/lib/auth-utils";
import { brandAccountId } from "@/lib/brand/account-scope";

export type ApplicationChatMessage = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

/** Tables/RPCs not present in generated Database types. */
function fromUntyped(table: string) {
  return (supabase as unknown as { from: (name: string) => any }).from(table);
}

function rpcUntyped(fn: string, args: Record<string, unknown>) {
  return supabase.rpc(fn as never, args as never);
}

function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function hasApplicationConversationAccess(
  otherUserId: string,
  options?: { opportunityId?: string | null; organizerId?: string | null }
): Promise<boolean> {
  const { data: sessionData } = await supabase.auth.getUser();
  const me = sessionData.user?.id ?? null;
  if (!me || !otherUserId) return false;

  const profile = await getCurrentUserProfile();
  const accountId = brandAccountId(profile) || me;

  if (options?.organizerId && (options.organizerId === me || options.organizerId === accountId)) {
    return true;
  }

  if (options?.opportunityId) {
    const { data: opp } = await supabase
      .from("opportunities")
      .select("organizer_id")
      .eq("id", options.opportunityId)
      .maybeSingle();
    if (opp?.organizer_id === me || opp?.organizer_id === accountId) return true;
  }

  const { data, error } = await rpcUntyped(
    "has_application_conversation_access",
    { other_user_id: otherUserId }
  );
  if (!error && data === true) return true;
  if (error) {
    console.warn("has_application_conversation_access", error.message);
  }

  const { data: ownedApps, error: ownedError } = await fromUntyped("applications")
    .select("id, opportunities!inner(organizer_id)")
    .eq("user_id", otherUserId)
    .eq("opportunities.organizer_id", accountId)
    .limit(1);

  if (!ownedError && Array.isArray(ownedApps) && ownedApps.length > 0) {
    return true;
  }

  return false;
}

export async function findOrCreateApplicationThread(
  myId: string,
  otherUserId: string
): Promise<string | null> {
  const [id1, id2] = sortedPair(myId, otherUserId);

  const { data: existing } = await fromUntyped("message_threads")
    .select("id")
    .eq("type", "individual")
    .or(
      `and(user_id_1.eq.${id1},user_id_2.eq.${id2}),and(user_id_1.eq.${id2},user_id_2.eq.${id1})`
    )
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data: created, error } = await fromUntyped("message_threads")
    .insert({
      type: "individual",
      user_id_1: id1,
      user_id_2: id2,
    })
    .select("id")
    .single();

  if (error) {
    console.error("create message_threads", error);
    return null;
  }
  return (created?.id as string) ?? null;
}

export async function listThreadMessages(
  threadId: string
): Promise<ApplicationChatMessage[]> {
  const { data, error } = await fromUntyped("messages")
    .select("id, sender_id, content, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    console.error("listThreadMessages", error);
    return [];
  }
  return (data || []) as ApplicationChatMessage[];
}

export async function sendThreadMessage(
  threadId: string,
  senderId: string,
  content: string
): Promise<ApplicationChatMessage | null> {
  const { data, error } = await fromUntyped("messages")
    .insert({
      thread_id: threadId,
      sender_id: senderId,
      content,
      message_type: "text",
    })
    .select("id, sender_id, content, created_at")
    .single();

  if (error) {
    console.error("sendThreadMessage", error);
    return null;
  }
  return data as ApplicationChatMessage;
}
