/** Spellings DJs use for the same genre, keyed by the canonical key. */
const GENRE_ALIASES: Record<string, string[]> = {
  drumandbass: ["dnb", "drumnbass", "drumbass", "d&b", "db"],
  hiphop: ["hiphop", "hip hop", "rap"],
  randb: ["rnb", "r&b", "rb", "rhythmandblues"],
  ukgarage: ["ukg", "garage"],
  afrobeats: ["afrobeat", "afro beats"],
};

function rawKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
}

const ALIAS_TO_KEY = new Map<string, string>();
for (const [key, aliases] of Object.entries(GENRE_ALIASES)) {
  for (const alias of aliases) ALIAS_TO_KEY.set(rawKey(alias), key);
}

/** Case, punctuation and spelling-insensitive key: "Drum & Bass" = "DnB" = "drum n bass". */
export function genreKey(genre: string | null | undefined): string {
  const key = rawKey(genre ?? "");
  return ALIAS_TO_KEY.get(key) ?? key;
}

export function djHasGenre(djGenres: string[], selected: string): boolean {
  const want = genreKey(selected);
  if (!want) return true;
  return djGenres.some((g) => genreKey(g) === want);
}

/**
 * Dropdown options: the base list plus every genre DJs actually have,
 * de-duplicated by key and keeping the first spelling seen.
 */
export function buildGenreOptions(
  base: readonly string[],
  djGenreLists: string[][]
): string[] {
  const byKey = new Map<string, string>();
  for (const g of base) {
    const key = genreKey(g);
    if (key && !byKey.has(key)) byKey.set(key, g);
  }
  for (const list of djGenreLists) {
    for (const g of list) {
      const label = g?.trim();
      const key = genreKey(label);
      if (label && key && !byKey.has(key)) byKey.set(key, label);
    }
  }
  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
}
