import { supabase } from "@/integrations/supabase/client";
import type { CommunityForEdit } from "./types";

export async function fetchCommunityById(
  id: string
): Promise<
  { ok: true; community: CommunityForEdit } | { ok: false; message: string }
> {
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return {
      ok: false,
      message: error?.message || "Community not found.",
    };
  }

  return { ok: true, community: data as CommunityForEdit };
}
