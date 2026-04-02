export const COMMUNITY_CREATE_LOCATION_OPTIONS = [
  "Global",
  "London",
  "Manchester",
  "Birmingham",
  "Bristol",
  "Berlin",
  "Paris",
  "New York",
  "Los Angeles",
  "Toronto",
] as const;

export type CommunityCreateLocation =
  (typeof COMMUNITY_CREATE_LOCATION_OPTIONS)[number];
