export type ApprovalLimitMode = "unlimited" | "one" | "limited";

export function maxApprovalsFromForm(
  mode: ApprovalLimitMode,
  count: number
): number | null {
  if (mode === "unlimited") return null;
  if (mode === "one") return 1;
  const parsed = Math.floor(Number(count));
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

export function formFromMaxApprovals(value: number | null | undefined): {
  mode: ApprovalLimitMode;
  count: number;
} {
  if (value == null || value <= 0) {
    return { mode: "unlimited", count: 2 };
  }
  if (value === 1) {
    return { mode: "one", count: 2 };
  }
  return { mode: "limited", count: value };
}
