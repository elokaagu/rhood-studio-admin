import { supabase } from "@/integrations/supabase/client";
import type { CommunityEditFormFields } from "./types";

export type UpdateCommunityResult =
  | { ok: true }
  | { ok: false; message: string };

export async function updateCommunity(
  communityId: string,
  fields: CommunityEditFormFields
): Promise<UpdateCommunityResult> {
  const { error } = await supabase
    .from("communities")
    .update({
      name: fields.name.trim(),
      description: fields.description.trim() || null,
      image_url: fields.imageUrl,
      location: fields.location,
      updated_at: new Date().toISOString(),
    })
    .eq("id", communityId);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
