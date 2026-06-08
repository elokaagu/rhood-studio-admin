import { supabase } from "@/integrations/supabase/client";

export type DeleteBrandResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Removes a brand user and related rows. Prefer a DB RPC for production;
 * this mirrors the previous client orchestration so RLS/admin policies apply.
 */
export async function deleteBrandWithRelations(
  userId: string
): Promise<DeleteBrandResult> {
  const { error: e1 } = await supabase
    .from("community_members")
    .delete()
    .eq("user_id", userId);
  if (e1) console.error("delete community_members:", e1);

  const { error: e2 } = await supabase
    .from("messages")
    .delete()
    .eq("sender_id", userId);
  if (e2) console.error("delete messages:", e2);

  const { error: e3 } = await supabase
    .from("applications")
    .delete()
    .eq("user_id", userId);
  if (e3) console.error("delete applications:", e3);

  const { error: e4a } = await supabase
    .from("message_threads" as never)
    .delete()
    .eq("participant_1", userId);
  if (e4a) console.error("delete message_threads p1:", e4a);

  const { error: e4b } = await supabase
    .from("message_threads" as never)
    .delete()
    .eq("participant_2", userId);
  if (e4b) console.error("delete message_threads p2:", e4b);

  for (const col of ["follower_id", "following_id", "user_id", "from_user_id", "to_user_id"]) {
    const { error: connErr } = await (supabase as any)
      .from("connections")
      .delete()
      .eq(col, userId);
    if (connErr && !connErr.message?.includes("does not exist")) {
      console.warn(`connections cleanup (${col}):`, connErr.message);
    }
  }

  const { error: profileError } = await supabase
    .from("user_profiles")
    .delete()
    .eq("id", userId);

  if (profileError) {
    if (
      profileError.message &&
      profileError.message.includes("foreign key")
    ) {
      return {
        ok: false,
        message:
          `Unable to delete brand due to database constraints. ` +
          `Run manual-user-deletion.sql in Supabase for user id: ${userId}`,
      };
    }
    return { ok: false, message: profileError.message };
  }

  return { ok: true };
}
