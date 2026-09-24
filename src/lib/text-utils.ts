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

const DANGLING_LAST_WORD =
  /\b(it|it's|its|the|a|an|and|or|for|to|of|in|on|with|this|that|who|what|your|you|you'll|we|we're|i)$/i;

/** Cut at maxLength without leaving a partial last word. */
export function clipToFullWord(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (trimmed.length <= maxLength) return trimmed;

  const sliced = trimmed.slice(0, maxLength);
  const next = trimmed.charAt(maxLength);
  if (!next || /\s/.test(next)) {
    return sliced.trimEnd();
  }

  const breakAt = Math.max(sliced.lastIndexOf(" "), sliced.lastIndexOf("\n"));
  if (breakAt <= 0) return sliced.trimEnd();
  return sliced.slice(0, breakAt).trimEnd();
}

/** Drop a trailing fragment like "...there. It" when the model stopped mid-sentence. */
export function stripIncompleteTrailingFragment(text: string): string {
  let result = text.trim();
  if (!result) return "";
  if (/[.!?…]"?$/.test(result)) return result;

  const lastWord = result.split(/\s+/).pop() || "";
  if (!DANGLING_LAST_WORD.test(lastWord.replace(/[^a-zA-Z']/g, ""))) {
    return result;
  }

  const sentenceSplit = result.match(/^(.*[.!?])(?:\s+\S+)?$/s);
  if (sentenceSplit?.[1]?.trim()) {
    return sentenceSplit[1].trim();
  }

  return result.replace(/\s+\S+$/, "").trimEnd();
}

export function clipBriefToLimit(text: string, maxLength: number): string {
  return stripIncompleteTrailingFragment(clipToFullWord(text, maxLength));
}

