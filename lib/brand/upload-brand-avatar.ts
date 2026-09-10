import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export type UploadBrandAvatarResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

export async function uploadBrandAvatar(
  userId: string,
  file: File
): Promise<UploadBrandAvatarResult> {
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "Image must be under 5MB." };
  }
  if (!ACCEPTED.includes(file.type)) {
    return { ok: false, message: "Use a JPEG, PNG, or WebP image." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `brand-avatars/${userId}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("opportunities")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, message: uploadError.message || "Upload failed." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("opportunities").getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ profile_image_url: publicUrl })
    .eq("id", userId);

  if (updateError) {
    return {
      ok: false,
      message: updateError.message || "Image uploaded but the profile could not be updated.",
    };
  }

  return { ok: true, url: publicUrl };
}
