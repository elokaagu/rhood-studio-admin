import { supabase } from "@/integrations/supabase/client";

function fromUntyped(table: string) {
  return (supabase as unknown as { from: (name: string) => any }).from(table);
}

export type BrandListItem = {
  id: string;
  name: string;
};

type BrandListRow = {
  id: string;
  brand_name: string | null;
  first_name: string | null;
  last_name: string | null;
  brand_account_id?: string | null;
};

function brandDisplayName(row: BrandListRow): string {
  return (
    row.brand_name?.trim() ||
    [row.first_name, row.last_name].filter(Boolean).join(" ") ||
    "Unnamed Brand"
  );
}

/** Lightweight fetch for admin dropdowns — one row per shared brand account. */
export async function fetchBrandList(): Promise<BrandListItem[]> {
  let { data, error } = await fromUntyped("user_profiles")
    .select("id, brand_name, first_name, last_name, brand_account_id")
    .eq("role", "brand")
    .order("brand_name", { ascending: true });

  if (error && /brand_account_id/i.test(error.message || "")) {
    ({ data, error } = await fromUntyped("user_profiles")
      .select("id, brand_name, first_name, last_name")
      .eq("role", "brand")
      .order("brand_name", { ascending: true }));
  }

  if (error || !data) return [];

  const rows = data as BrandListRow[];
  const byId = new Map(rows.map((row) => [row.id, row]));
  const seen = new Set<string>();
  const items: BrandListItem[] = [];

  for (const row of rows) {
    const ownerId = row.brand_account_id?.trim() || row.id;
    if (seen.has(ownerId)) continue;
    seen.add(ownerId);
    const owner = byId.get(ownerId) || row;
    items.push({
      id: ownerId,
      name: brandDisplayName(owner),
    });
  }

  return items.sort((a, b) => a.name.localeCompare(b.name));
}
