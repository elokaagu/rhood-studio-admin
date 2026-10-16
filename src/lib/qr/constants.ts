import { DJ_IOS_APP_STORE_URL_DEFAULT, getDjIosAppStoreUrl } from "@/lib/portal-url";

export const QR_COOKIE = "rhood_qr";
export const QR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function defaultQrDestinationUrl(): string {
  return getDjIosAppStoreUrl() || DJ_IOS_APP_STORE_URL_DEFAULT;
}

export function qrShortPath(code: string): string {
  return `/r/${encodeURIComponent(code)}`;
}
