/**
 * Utility functions for text processing, especially for handling markdown links
 * in character count calculations.
 */

/**
 * Calculates the display length of text, excluding markdown link syntax.
 * For example: "Check [this](url)" has a display length of 11 (not 23).
 * @param text The text to measure
 * @returns The display length (visible character count)
 */
export function getDisplayLength(text: string): number {
  if (!text) return 0;

  // Regex to match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  // Replace all markdown links with just the link text
  const displayText = text.replace(linkRegex, (match, linkText) => linkText);

  return displayText.length;
}

/**
 * Extracts the display text from markdown, replacing links with just their text.
 * @param text The text with markdown links
 * @returns The display text without markdown syntax
 */
export function getDisplayText(text: string): string {
  if (!text) return "";

  // Regex to match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  // Replace all markdown links with just the link text
  return text.replace(linkRegex, (match, linkText) => linkText);
}

