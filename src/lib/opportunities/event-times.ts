import { isValidTimeZone } from "@/lib/opportunities/timezones";

const TWENTY_HOURS_MS = 20 * 60 * 60 * 1000;

function pad2(value: number | string): string {
  return String(value).padStart(2, "0");
}

function normalizeClock(time: string): string {
  const trimmed = time.trim();
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

function localYmd(value: Date): string {
  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
}

function localHm(value: Date): string {
  return `${pad2(value.getHours())}:${pad2(value.getMinutes())}`;
}

function addDaysYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`;
}

function zonedParts(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "0";

  let hour = Number(get("hour"));
  if (hour === 24) hour = 0;

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour,
    minute: Number(get("minute")),
    second: Number(get("second")),
  };
}

/** How far ahead of UTC this zone is at `instant`. */
function offsetMsAt(instant: Date, timeZone: string): number {
  const wall = zonedParts(instant, timeZone);
  const asUtc = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second
  );
  return asUtc - instant.getTime();
}

/** Parse `YYYY-MM-DD` + `HH:MM` as a local datetime. */
export function parseLocalDateTime(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute, second] = normalizeClock(time).split(":").map(Number);
  return new Date(
    year,
    (month || 1) - 1,
    day || 1,
    hour || 0,
    minute || 0,
    second || 0
  );
}

/** Parse a wall-clock time in an IANA timezone into an absolute instant. */
export function parseZonedDateTime(
  date: string,
  time: string,
  timeZone: string
): Date {
  const asUtc = new Date(`${date}T${normalizeClock(time)}Z`);
  if (isNaN(asUtc.getTime())) return asUtc;
  let instant = new Date(asUtc.getTime() - offsetMsAt(asUtc, timeZone));
  instant = new Date(asUtc.getTime() - offsetMsAt(instant, timeZone));
  return instant;
}

export function parseEventDateTime(
  date: string,
  time: string,
  timeZone?: string | null
): Date {
  const tz = timeZone?.trim();
  if (tz && isValidTimeZone(tz)) {
    const parsed = parseZonedDateTime(date, time, tz);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return parseLocalDateTime(date, time);
}

export function formatZonedDateTime(
  value: Date | string,
  timeZone: string
): { date: string; time: string } {
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return { date: "", time: "" };
  const parts = zonedParts(date, timeZone);
  return {
    date: `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`,
    time: `${pad2(parts.hour)}:${pad2(parts.minute)}`,
  };
}

export function wallClockInZone(
  value: Date,
  timeZone?: string | null
): { date: string; time: string } {
  const tz = timeZone?.trim();
  if (tz && isValidTimeZone(tz)) {
    return formatZonedDateTime(value, tz);
  }
  return { date: localYmd(value), time: localHm(value) };
}

/**
 * If finish is not after start (e.g. 23:30 → 00:15), treat finish as the next
 * calendar day so overnight gigs are valid.
 */
export function resolveEndAfterStart(
  start: Date,
  end: Date,
  timeZone?: string | null
): Date {
  if (end.getTime() > start.getTime()) return end;
  const tz = timeZone?.trim();
  if (tz && isValidTimeZone(tz)) {
    const wall = formatZonedDateTime(end, tz);
    return parseZonedDateTime(addDaysYmd(wall.date, 1), wall.time, tz);
  }
  const nextDay = new Date(end);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay;
}

/** True when the end falls on the next calendar day within a typical overnight set. */
export function isOvernightSpan(
  start: Date,
  end: Date,
  timeZone?: string | null
): boolean {
  const duration = end.getTime() - start.getTime();
  if (duration <= 0 || duration >= TWENTY_HOURS_MS) return false;
  const tz = timeZone?.trim();
  if (tz && isValidTimeZone(tz)) {
    return (
      formatZonedDateTime(start, tz).date !== formatZonedDateTime(end, tz).date
    );
  }
  return localYmd(start) !== localYmd(end);
}
