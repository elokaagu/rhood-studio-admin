import type { BrandsSortOption } from "./types";

export function brandsSortToSupabaseOrder(sortBy: BrandsSortOption): {
  column: "created_at" | "updated_at";
  ascending: boolean;
} {
  switch (sortBy) {
    case "date_joined_newest":
      return { column: "created_at", ascending: false };
    case "date_joined_oldest":
      return { column: "created_at", ascending: true };
    case "last_active_newest":
      return { column: "updated_at", ascending: false };
    case "last_active_oldest":
      return { column: "updated_at", ascending: true };
    default:
      return { column: "created_at", ascending: false };
  }
}
