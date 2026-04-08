import { supabase } from "@/integrations/supabase/client";
import type { StorageImageItem } from "@/lib/mixes/types";

const IMAGE_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

/**
 * Recursively lists image files under the mixes bucket (admin tooling — can be heavy).
 */
export async function listMixBucketImagesRecursive(): Promise<StorageImageItem[]> {
  const allImages: StorageImageItem[] = [];

  const listFolderRecursive = async (folderPath: string = "") => {
    const { data: files, error } = await supabase.storage
      .from("mixes")
      .list(folderPath, {
        limit: 1000,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      return;
    }
    if (!files) return;

    for (const file of files) {
      const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name;

      const isImage = IMAGE_EXT.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (isImage) {
        let signedUrl: string | null = null;
        try {
          const { data: signed } = await supabase.storage
            .from("mixes")
            .createSignedUrl(fullPath, 60 * 60 * 24);
          signedUrl = signed?.signedUrl ?? null;
        } catch {
          signedUrl = null;
        }

        allImages.push({
          name: file.name,
          path: fullPath,
          size: file.metadata?.size ?? 0,
          created_at: file.created_at,
          signedUrl,
        });
      } else if (
        !file.name.includes(".") ||
        file.metadata?.mimetype?.startsWith("audio/")
      ) {
        if (!file.name.includes(".") || file.metadata?.mimetype === null) {
          await listFolderRecursive(fullPath);
        }
      }
    }
  };

  await listFolderRecursive("");
  return allImages;
}
