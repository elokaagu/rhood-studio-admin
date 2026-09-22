import { supabase } from "@/integrations/supabase/client";
import { missingColumnFromError } from "@/lib/opportunities/missing-column";

function fromUntyped(table: string) {
  return (supabase as unknown as { from: (name: string) => any }).from(table);
}

/** Drop max_approvals so the first write never hits PostgREST schema cache. */
export function withoutMaxApprovals(payload: Record<string, unknown>): {
  body: Record<string, unknown>;
  maxApprovals: number | null | undefined;
} {
  const body = { ...payload };
  const maxApprovals = body.max_approvals as number | null | undefined;
  delete body.max_approvals;
  return { body, maxApprovals };
}

export async function writeOpportunity(
  body: Record<string, unknown>,
  mode: "insert" | "update",
  opportunityId?: string
): Promise<{
  data: { id?: string } | null;
  error: { message?: string; details?: string; hint?: string; code?: string } | null;
}> {
  const payload = { ...body };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const query =
      mode === "insert"
        ? fromUntyped("opportunities").insert(payload).select("id").single()
        : fromUntyped("opportunities")
            .update(payload)
            .eq("id", opportunityId)
            .select("id")
            .maybeSingle();
    const result = await query;
    if (!result.error) {
      return { data: result.data, error: null };
    }
    const missing = missingColumnFromError(result.error);
    if (!missing || !(missing in payload)) {
      return { data: result.data, error: result.error };
    }
    delete payload[missing];
  }
  return { data: null, error: { message: "Failed to save opportunity." } };
}

/** Best-effort: store the cap after the listing exists. Ignore schema-cache errors. */
export async function persistMaxApprovals(
  opportunityId: string,
  maxApprovals: number | null | undefined
) {
  if (maxApprovals === undefined) return;
  await fromUntyped("opportunities")
    .update({ max_approvals: maxApprovals })
    .eq("id", opportunityId);
}
