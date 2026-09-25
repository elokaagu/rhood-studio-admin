import type { BookableDJ } from "./bookable-dj";
import { djHasGenre, genreKey } from "./genre-match";
import { djMatchesLocationFilter } from "./location-match";

export interface BookableDJFilterState {
  searchTerm: string;
  selectedGenre: string;
  selectedLocation: string;
  creditsFilter: "all" | "top10" | "top50" | "top100";
  availabilityFilter: "all" | "available" | "busy";
}

const TOP_N: Record<Exclude<BookableDJFilterState["creditsFilter"], "all">, number> = {
  top10: 10,
  top50: 50,
  top100: 100,
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function searchHaystack(dj: BookableDJ): string {
  return normalizeText(
    [
      dj.dj_name,
      `${dj.first_name} ${dj.last_name}`,
      dj.city,
      dj.bio ?? "",
      ...dj.genres,
    ].join(" \n ")
  );
}

function genreKeys(dj: BookableDJ): string {
  return dj.genres.map(genreKey).join(" ");
}

/** Every word must appear somewhere; genre words also match other spellings ("dnb"). */
function matchesSearch(dj: BookableDJ, term: string): boolean {
  const words = normalizeText(term).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = searchHaystack(dj);
  const keys = genreKeys(dj);
  return words.every(
    (word) => haystack.includes(word) || (genreKey(word) && keys.includes(genreKey(word)))
  );
}

/**
 * Leaderboard position by credits across all DJs, ties sharing a rank.
 * DJs with no credits are unranked.
 */
export function creditRanks(djs: BookableDJ[]): Map<string, number> {
  const sorted = djs.filter((dj) => dj.credits > 0).sort((a, b) => b.credits - a.credits);
  const ranks = new Map<string, number>();
  sorted.forEach((dj, index) => {
    const previous = sorted[index - 1];
    const rank =
      previous && previous.credits === dj.credits ? ranks.get(previous.id)! : index + 1;
    ranks.set(dj.id, rank);
  });
  return ranks;
}

/**
 * Client-side filters for the discovery grid. For large catalogs, move filters server-side.
 */
export function filterBookableDjs(
  djs: BookableDJ[],
  f: BookableDJFilterState
): BookableDJ[] {
  const ranks = f.creditsFilter === "all" ? null : creditRanks(djs);
  const maxRank = f.creditsFilter === "all" ? Infinity : TOP_N[f.creditsFilter];

  return djs.filter((dj) => {
    if (!matchesSearch(dj, f.searchTerm)) return false;
    if (f.selectedGenre !== "all" && !djHasGenre(dj.genres, f.selectedGenre)) return false;
    if (!djMatchesLocationFilter(dj.city, f.selectedLocation)) return false;
    if (ranks) {
      const rank = ranks.get(dj.id);
      if (rank == null || rank > maxRank) return false;
    }
    if (f.availabilityFilter !== "all" && dj.availability !== f.availabilityFilter) {
      return false;
    }
    return true;
  });
}
