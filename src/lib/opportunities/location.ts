export const ONLINE_LOCATION = "Online";

export function isOnlineLocation(value: string | null | undefined): boolean {
  return (value ?? "").trim().toLowerCase() === "online";
}

export function isMappableLocation(value: string | null | undefined): boolean {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 && !isOnlineLocation(trimmed);
}
