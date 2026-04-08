import { supabase } from "@/integrations/supabase/client";
import { getAudioDurationFromUrl } from "@/lib/mixes/audio-duration";

type MixRepairRow = {
  id: string;
  image_url: string | null;
  file_url: string | null;
  duration: string | null;
};

function findImageFile(
  files:
    | {
        name: string;
        id?: string;
        metadata?: { mimetype?: string | null; size?: number };
      }[]
    | null
    | undefined
) {
  if (!files || files.length === 0) return null;
  const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

  const exactArtwork = files.find((file) =>
    file.name.toLowerCase().startsWith("artwork")
  );
  if (exactArtwork) return exactArtwork;

  return files.find((file) =>
    imageExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
  );
}

async function resolveArtworkSignedUrl(mix: MixRepairRow): Promise<string | null> {
  try {
    if (mix.id) {
      const { data: files, error: listError } = await supabase.storage
        .from("mixes")
        .list(`${mix.id}`);

      if (!listError && files && files.length > 0) {
        const artworkFile = findImageFile(files);
        if (artworkFile) {
          const { data: signed } = await supabase.storage
            .from("mixes")
            .createSignedUrl(`${mix.id}/${artworkFile.name}`, 60 * 60 * 24 * 7);
          if (signed?.signedUrl) return signed.signedUrl;
        }
      }
    }

    if (mix.file_url?.includes("/storage/v1/object/public/mixes/")) {
      const pathMatch = mix.file_url.match(
        /storage\/v1\/object\/public\/mixes\/(.+)\/[^/]+$/
      );
      const folderPath = pathMatch ? pathMatch[1] : undefined;
      if (folderPath) {
        const { data: files, error: legacyListError } = await supabase.storage
          .from("mixes")
          .list(folderPath);

        if (!legacyListError && files && files.length > 0) {
          const artworkFile = findImageFile(files);
          if (artworkFile) {
            const { data: signed } = await supabase.storage
              .from("mixes")
              .createSignedUrl(`${folderPath}/${artworkFile.name}`, 60 * 60 * 24 * 7);
            if (signed?.signedUrl) return signed.signedUrl;
          }
        }
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Explicit admin repair: scans storage / audio and persists `image_url` and `duration`.
 * Do not call during normal list load.
 */
export async function repairMixesMetadata(options: {
  forceRefreshArtwork: boolean;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error } = await supabase
    .from("mixes")
    .select("id, image_url, file_url, duration");

  if (error || !data) {
    return {
      ok: false,
      message: error?.message || "Failed to load mixes for repair.",
    };
  }

  const rows = data as MixRepairRow[];

  await Promise.all(
    rows.map(async (mix) => {
      let imageUrl = mix.image_url;

      const shouldRefreshArtwork = options.forceRefreshArtwork || !imageUrl;
      if (shouldRefreshArtwork) {
        const refreshedUrl = await resolveArtworkSignedUrl(mix);
        if (refreshedUrl && refreshedUrl !== imageUrl) {
          imageUrl = refreshedUrl;
          await supabase.from("mixes").update({ image_url: refreshedUrl }).eq("id", mix.id);
        }
      }

      if (!mix.duration) {
        const audioUrl = mix.file_url ?? undefined;
        if (audioUrl && audioUrl !== "pending") {
          try {
            const durationString = await getAudioDurationFromUrl(audioUrl);
            if (durationString) {
              await supabase
                .from("mixes")
                .update({ duration: durationString })
                .eq("id", mix.id);
            }
          } catch {
            /* ignore */
          }
        }
      }
    })
  );

  return { ok: true };
}
