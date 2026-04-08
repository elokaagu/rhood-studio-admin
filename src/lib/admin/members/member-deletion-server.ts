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

  const conn = rawFrom(client, "connections");
  const { error: followerError } = await conn.delete().eq("follower_id", userId);
  if (followerError) {
    return {
      ok: false,
      message: `Failed to delete connections: ${followerError.message}`,
    };
  }
  const { error: followingError } = await conn.delete().eq("following_id", userId);
  if (followingError) {
    return {
      ok: false,
      message: `Failed to delete connections: ${followingError.message}`,
    };
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
