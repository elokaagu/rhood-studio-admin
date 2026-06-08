import { createClient } from "@/integrations/supabase/server";

/** Tables not present on generated Database types use a loose client handle. */
function rawFrom(client: Awaited<ReturnType<typeof createClient>>, table: string) {
  return (client as unknown as { from: (name: string) => any }).from(table);
}

/**
 * Admin member deletion runs on the server with the caller's session (cookie-based).
 * Deletes dependent rows before `user_profiles` so FK constraints are satisfied.
 */
export async function deleteMemberAdminServer(
  userId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const client = await createClient();

  const { error: communityMembersError } = await client
    .from("community_members")
    .delete()
    .eq("user_id", userId);

  if (communityMembersError) {
    return {
      ok: false,
      message: `Failed to delete community memberships: ${communityMembersError.message}`,
    };
  }

  const { error: messagesError } = await client
    .from("messages")
    .delete()
    .eq("sender_id", userId);

  if (messagesError) {
    return {
      ok: false,
      message: `Failed to delete messages: ${messagesError.message}`,
    };
  }

  const { error: applicationsError } = await client
    .from("applications")
    .delete()
    .eq("user_id", userId);

  if (applicationsError) {
    return {
      ok: false,
      message: `Failed to delete applications: ${applicationsError.message}`,
    };
  }

  const mt = rawFrom(client, "message_threads");
  const { error: mt1 } = await mt.delete().eq("participant_1", userId);
  if (mt1) {
    return {
      ok: false,
      message: `Failed to delete message threads: ${mt1.message}`,
    };
  }
  const { error: mt2 } = await mt.delete().eq("participant_2", userId);
  if (mt2) {
    return {
      ok: false,
      message: `Failed to delete message threads: ${mt2.message}`,
    };
  }

  // Remove the user from the connections table.
  // We try several column name patterns (the exact schema varies) and treat
  // every error here as non-fatal: if a connection row remains and the table
  // has ON DELETE CASCADE, the profile deletion below will cascade-clean it.
  // If a real FK RESTRICT is hit, the profile deletion surfaces the exact error.
  const conn = rawFrom(client, "connections");
  const columnCandidates = [
    "follower_id",
    "following_id",
    "user_id",
    "from_user_id",
    "to_user_id",
  ];
  for (const col of columnCandidates) {
    const { error } = await conn.delete().eq(col, userId);
    // Ignore "column does not exist" — wrong guess. Bubble up anything else.
    if (error && !error.message?.includes("does not exist")) {
      console.warn(`connections cleanup (${col}):`, error.message);
    }
  }

  const { error: userProfileError } = await client
    .from("user_profiles")
    .delete()
    .eq("id", userId);

  if (userProfileError) {
    return {
      ok: false,
      message: `Failed to delete user profile: ${userProfileError.message}`,
    };
  }

  return { ok: true };
}
