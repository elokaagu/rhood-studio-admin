import { supabase } from "@/integrations/supabase/client";

export type ApplicationChatMessage = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

function sortedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function hasApplicationConversationAccess(
  otherUserId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc(
    "has_application_conversation_access",
    { other_user_id: otherUserId }
  );
  if (error) {
    console.warn("has_application_conversation_access", error.message);
    return false;
  }
  return data === true;
}

export async function findOrCreateApplicationThread(
  myId: string,
  otherUserId: string
): Promise<string | null> {
  const [id1, id2] = sortedPair(myId, otherUserId);

  const { data: existing } = await supabase
    .from("message_threads")
    .select("id")
    .eq("type", "individual")
    .or(
      `and(user_id_1.eq.${id1},user_id_2.eq.${id2}),and(user_id_1.eq.${id2},user_id_2.eq.${id1})`
    )
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data: created, error } = await supabase
    .from("message_threads")
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
  const { data, error } = await supabase
    .from("messages")
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
  const { data, error } = await supabase
    .from("messages")
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
