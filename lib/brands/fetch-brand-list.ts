import { supabase } from "@/integrations/supabase/client";

export type BrandListItem = {
  id: string;
  name: string;
};

/** Lightweight fetch for admin dropdowns — just id + display name. */
export async function fetchBrandList(): Promise<BrandListItem[]> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, brand_name, first_name, last_name")
    .eq("role", "brand")
    .order("brand_name", { ascending: true });

  if (error || !data) return [];

  return data.map((row: any) => ({
    id: row.id,
    name:
      row.brand_name?.trim() ||
      [row.first_name, row.last_name].filter(Boolean).join(" ") ||
      "Unnamed Brand",
  }));
}
