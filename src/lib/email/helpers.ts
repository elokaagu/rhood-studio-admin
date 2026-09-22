export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function displayName(row: {
  dj_name?: string | null;
  brand_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}): string {
  const dj = row.dj_name?.trim();
  if (dj) return dj;
  const brand = row.brand_name?.trim();
  if (brand) return brand;
  const full = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
  if (full) return full;
  return row.email?.trim() || "there";
}

export function firstNameFrom(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}
