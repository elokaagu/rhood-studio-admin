import type { SupabaseClient } from "@supabase/supabase-js";

/** Tables not present on generated Database types use a loose client handle. */
function rawFrom(client: SupabaseClient, table: string) {
  return (client as unknown as { from: (name: string) => any }).from(table);
}

function isMissingSchemaError(message: string | undefined) {
  const msg = (message || "").toLowerCase();
  return (
    msg.includes("does not exist") ||
    msg.includes("could not find") ||
    msg.includes("schema cache")
  );
}

async function deleteEq(
  client: SupabaseClient,
  table: string,
  column: string,
  userId: string,
  label: string
): Promise<{ ok: false; message: string } | null> {
  const { error } = await rawFrom(client, table).delete().eq(column, userId);
  if (error && !isMissingSchemaError(error.message)) {
    return { ok: false, message: `Failed to delete ${label}: ${error.message}` };
  }
  return null;
}

/**
 * Deletes dependent rows, then the profile, using a service-role client.
 * Auth (admin check) happens in the API route before this runs.
 */
export async function deleteMemberAdminServer(
  admin: SupabaseClient,
  userId: string,
  callerId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (userId === callerId) {
    return { ok: false, message: "You cannot delete your own account." };
  }

  const steps: Array<[table: string, column: string, label: string]> = [
    ["community_members", "user_id", "community memberships"],
    ["community_posts", "author_id", "community posts"],
    ["messages", "sender_id", "messages"],
    ["applications", "user_id", "applications"],
    ["notifications", "user_id", "notifications"],
    ["ai_matching_feedback", "user_id", "matching feedback"],
    ["mixes", "uploaded_by", "mixes"],
    ["booking_requests", "dj_id", "booking requests"],
    ["booking_requests", "brand_id", "booking requests"],
    ["message_threads", "participant_1", "message threads"],
    ["message_threads", "participant_2", "message threads"],
  ];

  for (const [table, column, label] of steps) {
    const failed = await deleteEq(admin, table, column, userId, label);
    if (failed) return failed;
  }

  const conn = rawFrom(admin, "connections");
  for (const col of [
    "follower_id",
    "following_id",
    "user_id",
    "from_user_id",
    "to_user_id",
  ]) {
    const { error } = await conn.delete().eq(col, userId);
    if (error && !isMissingSchemaError(error.message)) {
      console.warn(`connections cleanup (${col}):`, error.message);
    }
  }

  const { error: userProfileError } = await admin
    .from("user_profiles")
    .delete()
    .eq("id", userId);

  if (userProfileError) {
    return {
      ok: false,
      message: `Failed to delete user profile: ${userProfileError.message}`,
    };
  }

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) {
    console.warn("[delete-member] auth user cleanup skipped:", authError.message);
  }

  return { ok: true };
}
