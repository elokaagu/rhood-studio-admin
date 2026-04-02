import type { BookableDJ } from "@/lib/booking/bookable-dj";

export interface BookableDJFilterState {
  searchTerm: string;
  selectedGenre: string;
  selectedLocation: string;
  creditsFilter: "all" | "top10" | "top50" | "top100";
  availabilityFilter: "all" | "available" | "busy";
}

/**
 * Client-side filters for the discovery grid. For large catalogs, move filters server-side.
 */
export function filterBookableDjs(
  djs: BookableDJ[],
  f: BookableDJFilterState
): BookableDJ[] {
  let filtered = [...djs];

  if (f.searchTerm.trim()) {
    const searchLower = f.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (dj) =>
        dj.dj_name.toLowerCase().includes(searchLower) ||
        dj.first_name.toLowerCase().includes(searchLower) ||
        dj.last_name.toLowerCase().includes(searchLower) ||
        dj.city.toLowerCase().includes(searchLower) ||
        dj.bio?.toLowerCase().includes(searchLower) ||
        dj.genres.some((g) => g.toLowerCase().includes(searchLower))
    );
  }

  if (f.selectedGenre !== "all") {
    filtered = filtered.filter((dj) => dj.genres.includes(f.selectedGenre));
  }

  if (f.selectedLocation.trim()) {
    const loc = f.selectedLocation.toLowerCase();
    filtered = filtered.filter((dj) => dj.city.toLowerCase().includes(loc));
  }

  if (f.creditsFilter !== "all") {
    const sortedByCredits = [...filtered].sort((a, b) => b.credits - a.credits);
    if (f.creditsFilter === "top10") filtered = sortedByCredits.slice(0, 10);
    else if (f.creditsFilter === "top50") filtered = sortedByCredits.slice(0, 50);
    else if (f.creditsFilter === "top100") filtered = sortedByCredits.slice(0, 100);
  }

  if (f.availabilityFilter !== "all") {
    filtered = filtered.filter((dj) => dj.availability === f.availabilityFilter);
  }

  return filtered;
}
