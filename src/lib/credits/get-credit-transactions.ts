import { supabase } from "@/integrations/supabase/client";
import type {
  CreditFilterType,
  CreditLedgerPage,
  CreditTransaction,
  CreditTransactionProfile,
} from "@/lib/credits/types";

function txTable() {
  return (supabase as unknown as { from: (name: string) => any }).from(
    "credit_transactions"
  );
}

function normalizeErrorMessage(error: unknown): string {
  if (!error) return "Failed to load credit transactions.";
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const err = error as { message?: string; code?: string };
    if (err.code === "42P01") {
      return "Credit transactions table does not exist. Run credits migrations.";
    }
    if (err.code === "42501") {
      return "You do not have permission to view this ledger.";
    }
    return err.message || "Failed to load credit transactions.";
  }
  return "Failed to load credit transactions.";
}

function getDisplayFilterClause(query: any, filter: CreditFilterType) {
  if (filter === "earned") return query.gt("amount", 0);
  if (filter === "spent") return query.lt("amount", 0);
  if (filter === "all") return query;
  return query.eq("transaction_type", filter);
}

export async function getCreditTransactionsPage(params: {
  filter: CreditFilterType;
  page: number;
  pageSize: number;
}): Promise<{ ok: true; data: CreditLedgerPage } | { ok: false; message: string }> {
  const { filter, page, pageSize } = params;
  const from = page * pageSize;
  const to = from + pageSize; // fetch one extra row to infer hasMore

  try {
    let query = txTable().select("*").order("created_at", { ascending: false });
    query = getDisplayFilterClause(query, filter);

    const { data, error } = await query.range(from, to);

    if (error) {
      return { ok: false, message: normalizeErrorMessage(error) };
    }

    const rows = (data ?? []) as Array<{
      id: string;
      user_id: string;
      amount: number;
      transaction_type: string;
      description: string | null;
      reference_id: string | null;
      reference_type: string | null;
      created_at: string;
    }>;

    const hasMore = rows.length > pageSize;
    const pageRows = hasMore ? rows.slice(0, pageSize) : rows;

    const userIds = Array.from(new Set(pageRows.map((r) => r.user_id).filter(Boolean)));

    let profileById = new Map<string, CreditTransactionProfile>();
    if (userIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, dj_name, brand_name, first_name, last_name, email")
        .in("id", userIds);

      if (!profileError && profiles) {
        profileById = new Map(
          profiles.map((p) => [
            p.id,
            {
              id: p.id,
              dj_name: p.dj_name,
              brand_name: p.brand_name,
              first_name: p.first_name,
              last_name: p.last_name,
              email: p.email,
            },
          ])
        );
      }
    }

    const txRows: CreditTransaction[] = pageRows.map((r) => ({
      ...r,
      user_profile: profileById.get(r.user_id) ?? null,
    }));

    const loadedEarned = txRows
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const loadedSpent = txRows
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      ok: true,
      data: {
        rows: txRows,
        summary: {
          loadedEarned,
          loadedSpent,
          loadedNet: loadedEarned - loadedSpent,
        },
        page,
        pageSize,
        hasMore,
      },
    };
  } catch (error) {
    return { ok: false, message: normalizeErrorMessage(error) };
  }
}
