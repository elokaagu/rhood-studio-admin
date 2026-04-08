import { formatDateShort } from "@/lib/date-utils";
import type { MixListItem, MixUploader } from "@/lib/mixes/types";

export function resolveArtistLabel(
  uploader: MixUploader | null,
  storedArtist: string | null
): string {
  const fullName = uploader
    ? [uploader.first_name, uploader.last_name]
        .map((part) => (typeof part === "string" ? part.trim() : ""))
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    (uploader?.dj_name ?? "").trim() ||
    fullName ||
    (storedArtist?.trim() ?? "") ||
    "Unknown Artist"
  );
}

type MixRow = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  description: string | null;
  applied_for: string | null;
  status: string;
  file_url: string;
  file_name: string;
  file_size: number;
  image_url: string | null;
  duration: string | null;
  plays: number | null;
  rating: number | null;
  created_at: string | null;
  uploader?: MixUploader | null;
};

export function rowToMixListItem(mix: MixRow): MixListItem {
  const storedArtist =
    typeof mix.artist === "string" ? mix.artist : null;
  const uploader = mix.uploader ?? null;

  return {
    id: mix.id,
    title: mix.title,
    artist: resolveArtistLabel(uploader, storedArtist),
    genre: mix.genre,
    status: mix.status,
    file_url: mix.file_url,
    file_name: mix.file_name,
    file_size: mix.file_size,
    image_url: mix.image_url,
    duration: mix.duration,
    plays: mix.plays ?? 0,
    rating: mix.rating ?? 0,
    applied_for: mix.applied_for,
    description: mix.description,
    created_at: mix.created_at,
    uploadDate: mix.created_at
      ? formatDateShort(mix.created_at)
      : "Unknown",
    audioUrl: mix.file_url,
    originalArtist: storedArtist ?? "",
  };
}
