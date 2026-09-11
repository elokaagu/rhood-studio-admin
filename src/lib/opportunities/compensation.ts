export function parseNumericCompensation(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^free$/i.test(trimmed)) return 0;

  const stripped = trimmed.replace(/^[£$€]\s*/, "").replace(/,/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(stripped)) return null;

  const value = Number(stripped);
  return Number.isFinite(value) ? value : null;
}

export function formatCompensationDisplay(
  compensation: string | null | undefined,
  payment: number | null | undefined
): string {
  const text = compensation?.trim();
  if (text) return text;
  if (payment != null && Number.isFinite(payment)) return `£${payment}`;
  return "";
}
