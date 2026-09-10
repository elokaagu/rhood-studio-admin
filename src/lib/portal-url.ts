export const PORTAL_BASE_URL = "https://portal.rhood.io";
export const DJ_APP_URL =
  process.env.NEXT_PUBLIC_DJ_APP_URL || "https://www.rhood.io/";
/** Marketing app page used until store URLs are set. */
export const DJ_APP_PAGE_URL = "https://www.rhood.io/app";

export function getPortalBaseUrl(): string {
  return PORTAL_BASE_URL;
}

function trimUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** iOS App Store listing. Set DJ_IOS_APP_STORE_URL or NEXT_PUBLIC_APP_STORE_URL. */
export function getDjIosAppStoreUrl(): string {
  return (
    trimUrl(process.env.DJ_IOS_APP_STORE_URL) ||
    trimUrl(process.env.NEXT_PUBLIC_APP_STORE_URL) ||
    DJ_APP_PAGE_URL
  );
}

/** Google Play listing. Set DJ_ANDROID_PLAY_STORE_URL. */
export function getDjAndroidPlayStoreUrl(): string {
  return trimUrl(process.env.DJ_ANDROID_PLAY_STORE_URL) || DJ_APP_PAGE_URL;
}
