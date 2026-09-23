const DEFAULT_AFTER_LOGIN = "/admin/dashboard";

/** Only allow in-app destinations so email `next` params cannot leave the portal. */
export function safePortalNextPath(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_AFTER_LOGIN;
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    /* keep the raw value */
  }
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("://") ||
    value.startsWith("/login") ||
    value.startsWith("/auth")
  ) {
    return DEFAULT_AFTER_LOGIN;
  }
  return value;
}

export function loginPathWithNext(nextPath: string): string {
  return `/login?next=${encodeURIComponent(safePortalNextPath(nextPath))}`;
}
