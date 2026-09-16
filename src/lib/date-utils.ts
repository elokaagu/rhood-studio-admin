// Utility functions for consistent date formatting across the application

import { shortZoneName } from "@/lib/opportunities/timezones";

function getOrdinalSuffix(day: number) {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function calendarParts(
  date: Date,
  month: "long" | "short",
  timeZone?: string | null
) {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month,
    year: "numeric",
  };
  if (timeZone) options.timeZone = timeZone;
  const parts = new Intl.DateTimeFormat("en-US", options).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    day: Number(get("day")),
    month: get("month"),
    year: get("year"),
  };
}

/**
 * Format date to "13th October 2025" format
 * @param dateString - Date string or Date object
 * @param timeZone - Optional IANA timezone for wall-clock calendar date
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string | Date | null,
  timeZone?: string | null
): string => {
  if (!dateString || dateString === "Unknown") return "Unknown";

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    let day: number;
    let month: string;
    let year: string;
    try {
      ({ day, month, year } = calendarParts(date, "long", timeZone));
    } catch {
      ({ day, month, year } = calendarParts(date, "long"));
    }

    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString.toString();
  }
};

/**
 * Format date to "13th Oct 2025" format (shorter version)
 * @param dateString - Date string or Date object
 * @returns Formatted date string
 */
export const formatDateShort = (
  dateString: string | Date | null,
  timeZone?: string | null
): string => {
  if (!dateString || dateString === "Unknown") return "Unknown";

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    let day: number;
    let month: string;
    let year: string;
    try {
      ({ day, month, year } = calendarParts(date, "short", timeZone));
    } catch {
      ({ day, month, year } = calendarParts(date, "short"));
    }

    return `${day}${getOrdinalSuffix(day)} ${month} ${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString.toString();
  }
};

/**
 * Format relative date (Today, Tomorrow, or formatted date)
 * @param dateString - Date string or Date object
 * @returns Relative date string
 */
export const formatRelativeDate = (
  dateString: string | Date | null
): string => {
  if (!dateString || dateString === "Unknown") return "Unknown";

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "Tomorrow";
    } else if (diffDays === 0) {
      return "Today";
    } else {
      return formatDateShort(date);
    }
  } catch (error) {
    console.error("Error formatting relative date:", error);
    return dateString.toString();
  }
};

/**
 * Format a date/time string into "HH:MM" 24-hour format.
 * @param dateString - Date string or Date object
 * @returns Formatted time string
 */
export const formatTime = (
  dateString: string | Date | null,
  timeZone?: string | null
): string => {
  if (!dateString) return "TBC";

  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "TBC";
    }

    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      hourCycle: "h23",
      ...(timeZone ? { timeZone } : {}),
    });
  } catch (error) {
    console.error("Error formatting time:", error);
    return "TBC";
  }
};

/**
 * Format a start and end time into a concise range string.
 * @param start - Start time string or Date
 * @param end - End time string or Date
 * @returns Time range string (e.g., "20:00 – 22:30")
 */
export const formatTimeRange = (
  start: string | Date | null,
  end: string | Date | null,
  timeZone?: string | null
): string => {
  const startFormatted = formatTime(start, timeZone);
  const endFormatted = end ? formatTime(end, timeZone) : null;

  const startIsTbc = startFormatted === "TBC";
  const endIsTbc = !endFormatted || endFormatted === "TBC";

  if (startIsTbc && endIsTbc) return "TBC";
  if (startIsTbc) return endFormatted || "TBC";
  if (endIsTbc) return startFormatted;

  return `${startFormatted} – ${endFormatted}`;
};

/** Opportunity clock: no finish time means an ongoing campaign, not TBC. */
export const formatOpportunityClock = (
  start: string | Date | null,
  end: string | Date | null,
  timeZone?: string | null
): string => {
  if (!end) return "Ongoing";
  const clock = formatTimeRange(start, end, timeZone);
  if (!timeZone || clock === "TBC") return clock;
  try {
    const at = start ? new Date(start) : new Date();
    const zone = shortZoneName(timeZone, isNaN(at.getTime()) ? new Date() : at);
    return `${clock} ${zone}`;
  } catch {
    return clock;
  }
};

/**
 * Compact date for booking cards/lists (e.g. "Thu, 15 Jan 2026").
 */
export const formatBookingEventDate = (dateString: string | Date | null): string => {
  if (!dateString) return "";
  try {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return typeof dateString === "string" ? dateString : "";
    }
    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return typeof dateString === "string" ? dateString : "";
  }
};
