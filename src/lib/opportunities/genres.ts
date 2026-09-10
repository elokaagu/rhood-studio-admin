export const OPPORTUNITY_GENRES = [
  "House",
  "Techno",
  "Drum & Bass",
  "Dubstep",
  "Trap",
  "Hip-Hop",
  "Electronic",
  "Progressive",
  "Trance",
  "Ambient",
  "Breakbeat",
] as const;

export function parseGenres(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((genre) => genre.trim())
    .filter(Boolean);
}

export function serializeGenres(genres: string[]): string {
  return genres.map((genre) => genre.trim()).filter(Boolean).join(", ");
}
