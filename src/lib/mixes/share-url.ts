import { getPortalBaseUrl } from "@/lib/portal-url";

const MIX_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isMixId(value: string): boolean {
  return MIX_ID_PATTERN.test(value);
}

/** Public player path: /[songId] */
export function getMixSharePath(mixId: string): string {
  return `/${mixId}`;
}

/** Canonical share URL: https://portal.rhood.io/[songId] */
export function getMixShareUrl(mixId: string): string {
  return `${getPortalBaseUrl()}${getMixSharePath(mixId)}`;
}

export function getMixAudioPath(mixId: string, download = false): string {
  const path = `/api/mixes/${mixId}/audio`;
  return download ? `${path}?download=1` : path;
}

/** Absolute audio URL on the portal, never the storage host. */
export function getMixAudioUrl(mixId: string, download = false): string {
  return `${getPortalBaseUrl()}${getMixAudioPath(mixId, download)}`;
}

/** Resolve a stored mix file_url (full URL or storage path) to a fetchable URL. */
export function resolveMixStorageUrl(fileUrl: string): string | null {
  const trimmed = fileUrl.trim();
  if (!trimmed || trimmed === "pending") return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/storage/v1/object/public/mixes/${trimmed.replace(/^\/+/, "")}`;
}
