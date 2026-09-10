export function googleMapsSearchUrl(query: string, placeId?: string): string {
  const params = new URLSearchParams({
    api: "1",
    query: query.trim(),
  });
  if (placeId?.trim()) {
    params.set("query_place_id", placeId.trim());
  }
  return `https://www.google.com/maps/search/?${params.toString()}`;
}
