const TWENTY_HOURS_MS = 20 * 60 * 60 * 1000;

/** Parse `YYYY-MM-DD` + `HH:MM` as a local datetime. */
export function parseLocalDateTime(date: string, time: string): Date {
  const trimmedTime = time.trim();
  const normalized = trimmedTime.length === 5 ? `${trimmedTime}:00` : trimmedTime;
  return new Date(`${date}T${normalized}`);
}

function localYmd(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * If finish is not after start (e.g. 23:30 → 00:15), treat finish as the next
 * calendar day so overnight gigs are valid.
 */
export function resolveEndAfterStart(start: Date, end: Date): Date {
  if (end.getTime() > start.getTime()) return end;
  const nextDay = new Date(end);
  nextDay.setDate(nextDay.getDate() + 1);
  return nextDay;
}

/** True when the end falls on the next local day within a typical overnight set. */
export function isOvernightSpan(start: Date, end: Date): boolean {
  const duration = end.getTime() - start.getTime();
  if (duration <= 0 || duration >= TWENTY_HOURS_MS) return false;
  return localYmd(start) !== localYmd(end);
}
