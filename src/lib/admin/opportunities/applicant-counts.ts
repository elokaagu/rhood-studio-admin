import { supabase } from "@/integrations/supabase/client";

function fromUntyped(table: string) {
  return (supabase as unknown as { from: (name: string) => any }).from(table);
}

function addCounts(
  map: Map<string, number>,
  rows: Array<{ opportunity_id?: string | null }> | null | undefined
) {
  for (const row of rows || []) {
    const id = row.opportunity_id;
    if (!id) continue;
    map.set(id, (map.get(id) ?? 0) + 1);
  }
}

/** Simple applications plus custom-form responses for each listing. */
export async function applicantCountsByOpportunity(
  ids: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;

  const [apps, forms] = await Promise.all([
    supabase.from("applications").select("opportunity_id").in("opportunity_id", ids),
    fromUntyped("application_form_responses")
      .select("opportunity_id")
      .in("opportunity_id", ids),
  ]);

  addCounts(map, apps.data as Array<{ opportunity_id?: string | null }> | null);
  const formMissing =
    forms.error &&
    (String(forms.error.message || "").includes("does not exist") ||
      forms.error.code === "42P01");
  if (!formMissing) {
    addCounts(map, forms.data as Array<{ opportunity_id?: string | null }> | null);
  }
  return map;
}

export async function fetchOpportunityApplicantCount(
  opportunityId: string
): Promise<number> {
  const map = await applicantCountsByOpportunity([opportunityId]);
  return map.get(opportunityId) ?? 0;
}
