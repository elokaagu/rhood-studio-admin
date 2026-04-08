/** Admin mixes list row — DB fields plus display-only joins */
export type MixUploader = {
  id: string;
  dj_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

export type MixListItem = {
  id: string;
  title: string;
  artist: string;
  genre: string;
  status: string;
  file_url: string;
  file_name: string;
  file_size: number;
  image_url: string | null;
  duration: string | null;
  plays: number;
  rating: number;
  applied_for: string | null;
  description: string | null;
  created_at: string | null;
  uploadDate: string;
  audioUrl: string;
  /** Stored `artist` before uploader resolution */
  originalArtist: string;
};

export type StorageImageItem = {
  name: string;
  path: string;
  size: number;
  created_at: string | undefined;
  signedUrl: string | null;
};
