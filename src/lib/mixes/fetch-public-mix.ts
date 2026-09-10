import { cache } from "react";
import { createClient } from "@/integrations/supabase/server";
import { isMixId } from "@/lib/mixes/share-url";

export type PublicMix = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  image_url: string | null;
  duration: string | null;
  file_url: string;
};

export const fetchPublicMix = cache(
  async (songId: string): Promise<PublicMix | null> => {
    if (!isMixId(songId)) return null;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("mixes")
      .select("id, title, artist, genre, image_url, duration, file_url")
      .eq("id", songId)
      .maybeSingle();

    if (error || !data?.file_url) return null;

    return {
      id: data.id,
      title: data.title,
      artist: data.artist,
      genre: data.genre,
      image_url: data.image_url,
      duration: data.duration,
      file_url: data.file_url,
    };
  }
);
