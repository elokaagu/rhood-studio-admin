import { supabase } from "@/integrations/supabase/client";
import { rowToMixListItem } from "@/lib/mixes/transform-mix";
import type { MixListItem } from "@/lib/mixes/types";

/**
 * Read-only: loads mixes and display fields. Does not write to the database.
 */
export async function fetchMixesList(): Promise<
  | { ok: true; mixes: MixListItem[] }
  | { ok: false; message: string }
> {
  const { data, error } = await supabase
    .from("mixes")
    .select(
      `
      *,
      uploader:user_profiles!mixes_uploaded_by_fkey(
        id,
        dj_name,
        first_name,
        last_name
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return {
      ok: false,
      message: error.message || "Failed to load mixes.",
    };
  }

  const mixes = (data ?? []).map((row) =>
    rowToMixListItem(row as Parameters<typeof rowToMixListItem>[0])
  );
  return { ok: true, mixes };
}
