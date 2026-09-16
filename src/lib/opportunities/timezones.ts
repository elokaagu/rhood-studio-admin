/** Curated IANA zones for opportunity event times. */
export const EVENT_TIMEZONES = [
  "UTC",
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Toronto",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "Atlantic/Azores",
  "Europe/London",
  "Europe/Dublin",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Warsaw",
  "Europe/Athens",
  "Europe/Istanbul",
  "Africa/Lagos",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Perth",
  "Australia/Adelaide",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

export function resolveTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) return tz;
  } catch {
    // ignore
  }
  return "UTC";
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function timezoneSelectOptions(current?: string | null): string[] {
  const list: string[] = [...EVENT_TIMEZONES];
  const extras = [current?.trim(), resolveTimeZone()].filter(
    (tz): tz is string => Boolean(tz)
  );
  for (const tz of extras) {
    if (!list.includes(tz) && isValidTimeZone(tz)) {
      list.unshift(tz);
    }
  }
  return list;
}

export function formatTimezoneLabel(
  timeZone: string,
  at: Date = new Date()
): string {
  const city = timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;
  try {
    const offset =
      new Intl.DateTimeFormat("en-GB", {
        timeZone,
        timeZoneName: "shortOffset",
        hour: "2-digit",
      })
        .formatToParts(at)
        .find((part) => part.type === "timeZoneName")?.value ?? "";
    return offset ? `${city} (${offset})` : city;
  } catch {
    return city;
  }
}

export function shortZoneName(
  timeZone: string,
  at: Date = new Date()
): string {
  try {
    return (
      new Intl.DateTimeFormat("en-GB", {
        timeZone,
        timeZoneName: "short",
        hour: "2-digit",
      })
        .formatToParts(at)
        .find((part) => part.type === "timeZoneName")?.value ?? timeZone
    );
  } catch {
    return timeZone;
  }
}
