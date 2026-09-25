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

/**
 * Inserts/updates, dropping any column the database doesn't have yet (pending
 * migration) and retrying. `droppedColumns` lists what wasn't saved.
 */
export async function writeOpportunity(
  body: Record<string, unknown>,
  mode: "insert" | "update",
  opportunityId?: string
): Promise<{
  data: { id?: string } | null;
  error: { message?: string; details?: string; hint?: string; code?: string } | null;
  droppedColumns: string[];
}> {
  const payload = { ...body };
  const droppedColumns: string[] = [];
  const maxAttempts = Object.keys(payload).length + 1;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
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
      if (droppedColumns.length > 0) {
        console.warn("Opportunity saved without missing columns:", droppedColumns);
      }
      return { data: result.data, error: null, droppedColumns };
    }
    const missing = missingColumnFromError(result.error);
    if (!missing || !(missing in payload)) {
      return { data: result.data, error: result.error, droppedColumns };
    }
    delete payload[missing];
    droppedColumns.push(missing);
  }
  return {
    data: null,
    error: { message: "Failed to save opportunity." },
    droppedColumns,
  };
}

/** Warning to show when the brand entered an order value the database couldn't store. */
export function orderValueNotSavedWarning(
  droppedColumns: string[],
  payload: Record<string, unknown>
): string | undefined {
  if (payload.order_value == null || !droppedColumns.includes("order_value")) {
    return undefined;
  }
  return "The opportunity was saved, but the order value wasn't: the database is missing the order value columns. Run the pending Studio migration, then edit this opportunity to add it again.";
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
