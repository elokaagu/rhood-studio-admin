export const PORTAL_BASE_URL = "https://portal.rhood.io";
export const DJ_APP_URL =
  process.env.NEXT_PUBLIC_DJ_APP_URL || "https://www.rhood.io/";

export function getPortalBaseUrl(): string {
  return PORTAL_BASE_URL;
}
