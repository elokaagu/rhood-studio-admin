/**
 * R/HOOD Typography System
 * Based on brand guidelines for consistent text styling
 */

// TS Block Bold - For impactful headings (always uppercase)
export const tsBlockStyles = {
  // Small impactful text
  xs: "font-ts-block ts-xs uppercase text-left",
  sm: "font-ts-block ts-sm uppercase text-left", 
  base: "font-ts-block ts-base uppercase text-left",
  lg: "font-ts-block ts-lg uppercase text-left",
  xl: "font-ts-block ts-xl uppercase text-left",
  "2xl": "font-ts-block ts-2xl uppercase text-left",
  "3xl": "font-ts-block ts-3xl uppercase text-left",
  "4xl": "font-ts-block ts-4xl uppercase text-left",
  "5xl": "font-ts-block ts-5xl uppercase text-left",
} as const;

// Helvetica Neue - For body text and subheadings
export const helveticaStyles = {
  // Light weight for body copy
  light: {
    xs: "font-helvetica-light helvetica-xs",
    sm: "font-helvetica-light helvetica-sm",
    base: "font-helvetica-light helvetica-base",
    lg: "font-helvetica-light helvetica-lg",
    xl: "font-helvetica-light helvetica-xl",
    "2xl": "font-helvetica-light helvetica-2xl",
    "3xl": "font-helvetica-light helvetica-3xl",
    "4xl": "font-helvetica-light helvetica-4xl",
    "5xl": "font-helvetica-light helvetica-5xl",
  },
  // Regular weight for general text
  regular: {
    xs: "font-helvetica-regular helvetica-xs",
    sm: "font-helvetica-regular helvetica-sm",
    base: "font-helvetica-regular helvetica-base",
    lg: "font-helvetica-regular helvetica-lg",
    xl: "font-helvetica-regular helvetica-xl",
    "2xl": "font-helvetica-regular helvetica-2xl",
    "3xl": "font-helvetica-regular helvetica-3xl",
    "4xl": "font-helvetica-regular helvetica-4xl",
    "5xl": "font-helvetica-regular helvetica-5xl",
  },
  // Bold weight for subheadings
  bold: {
    xs: "font-helvetica-bold helvetica-xs",
    sm: "font-helvetica-bold helvetica-sm",
    base: "font-helvetica-bold helvetica-base",
    lg: "font-helvetica-bold helvetica-lg",
    xl: "font-helvetica-bold helvetica-xl",
    "2xl": "font-helvetica-bold helvetica-2xl",
    "3xl": "font-helvetica-bold helvetica-3xl",
    "4xl": "font-helvetica-bold helvetica-4xl",
    "5xl": "font-helvetica-bold helvetica-5xl",
  },
} as const;

// Brand color utilities
export const brandColors = {
  primary: "text-brand-green",
  black: "text-brand-black", 
  white: "text-brand-white",
  muted: "text-muted-foreground",
} as const;

// Common text combinations
export const textStyles = {
  // Headlines using TS Block
  headline: {
    main: `${tsBlockStyles["2xl"]} ${brandColors.white}`,
    section: `${tsBlockStyles.xl} ${brandColors.white}`,
    card: `${tsBlockStyles.lg} ${brandColors.white}`,
    badge: `${tsBlockStyles.xs} ${brandColors.primary}`,
  },
  // Body text using Helvetica
  body: {
    large: `${helveticaStyles.regular.lg} ${brandColors.white}`,
    regular: `${helveticaStyles.regular.base} ${brandColors.white}`,
    small: `${helveticaStyles.regular.sm} ${brandColors.muted}`,
    light: `${helveticaStyles.light.base} ${brandColors.muted}`,
  },
  // Subheadings using Helvetica Bold
  subheading: {
    large: `${helveticaStyles.bold.xl} ${brandColors.white}`,
    regular: `${helveticaStyles.bold.lg} ${brandColors.white}`,
    small: `${helveticaStyles.bold.base} ${brandColors.white}`,
  },
} as const;

// Utility function to create TS Block text with proper line breaks
export function createTSBlockText(text: string, maxWordsPerLine: number = 2): string {
  const words = text.toUpperCase().split(' ');
  const lines: string[] = [];
  
  for (let i = 0; i < words.length; i += maxWordsPerLine) {
    const line = words.slice(i, i + maxWordsPerLine).join(' ');
    lines.push(line);
  }
  
  return lines.join('<br />');
}

// Utility function to get appropriate TS Block size based on text length
export function getTSBlockSize(text: string): keyof typeof tsBlockStyles {
  const wordCount = text.split(' ').length;
  
  if (wordCount <= 2) return '2xl';
  if (wordCount <= 4) return 'xl';
  if (wordCount <= 6) return 'lg';
  if (wordCount <= 8) return 'base';
  return 'sm';
}
