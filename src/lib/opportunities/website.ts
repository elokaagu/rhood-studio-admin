/** Normalize a website field to an absolute URL, or null if empty. */
export function normalizeWebsiteUrl(
  raw: string | null | undefined
): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function websiteDisplayLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname === "/" ? "" : parsed.pathname}`;
  } catch {
    return url.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }
}
