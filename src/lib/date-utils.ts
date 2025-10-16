// Utility functions for consistent date formatting across the application

/**
 * Format date to "13th October 2025" format
 * @param dateString - Date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (dateString: string | Date | null): string => {
  if (!dateString || dateString === "Unknown") return "Unknown";

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();

    // Add ordinal suffix to day
    const getOrdinalSuffix = (day: number) => {
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
    };

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
export const formatDateShort = (dateString: string | Date | null): string => {
  if (!dateString || dateString === "Unknown") return "Unknown";

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    const day = date.getDate();
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = date.getFullYear();

    // Add ordinal suffix to day
    const getOrdinalSuffix = (day: number) => {
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
    };

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
