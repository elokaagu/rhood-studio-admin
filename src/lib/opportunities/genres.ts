export const ALL_GENRES_LABEL = "All genres";

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

export function isAllGenres(genres: string[]): boolean {
  if (genres.length === 1) {
    return genres[0].trim().toLowerCase() === ALL_GENRES_LABEL.toLowerCase();
  }
  if (genres.length !== OPPORTUNITY_GENRES.length) return false;
  const selected = new Set(genres.map((genre) => genre.trim().toLowerCase()));
  return OPPORTUNITY_GENRES.every((genre) =>
    selected.has(genre.toLowerCase())
  );
}

export function parseGenres(value: string | null | undefined): string[] {
  if (!value?.trim()) return [];
  if (value.trim().toLowerCase() === ALL_GENRES_LABEL.toLowerCase()) {
    return [ALL_GENRES_LABEL];
  }
  const parsed = value
    .split(",")
    .map((genre) => genre.trim())
    .filter(Boolean);
  return isAllGenres(parsed) ? [ALL_GENRES_LABEL] : parsed;
}

export function serializeGenres(genres: string[]): string {
  if (isAllGenres(genres)) return ALL_GENRES_LABEL;
  return genres.map((genre) => genre.trim()).filter(Boolean).join(", ");
}
