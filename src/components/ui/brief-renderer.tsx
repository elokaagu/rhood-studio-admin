"use client";

import React from "react";
import { LinkText } from "./link-text";
import { textStyles } from "@/lib/typography";

interface BriefRendererProps {
  text: string;
  className?: string;
}

/**
 * Component that renders a formatted brief with markdown-style sections.
 * Supports:
 * - **Bold** headers
 * - Section separators (---)
 * - Numbered lists (1., 2., etc.)
 * - Links [text](url)
 */
export function BriefRenderer({ text, className = "" }: BriefRendererProps) {
  if (!text) return null;

  // Split by section separators
  const sections = text.split(/\n\n---\n\n/).filter(Boolean);

  return (
    <div className={`space-y-6 ${className}`}>
      {sections.map((section, sectionIndex) => {
        // Split section into lines
        const lines = section.split("\n").filter(Boolean);
        const renderedLines: React.ReactNode[] = [];
        let currentParagraph: string[] = [];

        lines.forEach((line, lineIndex) => {
          const trimmedLine = line.trim();

          // Check if it's a header (starts with ** and ends with **)
          if (trimmedLine.match(/^\*\*.*\*\*$/)) {
            // Flush current paragraph
            if (currentParagraph.length > 0) {
              renderedLines.push(
                <p key={`para-${lineIndex}`} className={`${textStyles.body.regular} mb-3`}>
                  <LinkText text={currentParagraph.join(" ")} />
                </p>
              );
              currentParagraph = [];
            }

            // Render header
            const headerText = trimmedLine.replace(/\*\*/g, "");
            renderedLines.push(
              <h3
                key={`header-${lineIndex}`}
                className={`${textStyles.subheading.regular} text-brand-green mb-2 mt-4 first:mt-0`}
              >
                {headerText}
              </h3>
            );
          } else if (trimmedLine.match(/^\d+\.\s+\*\*.*\*\*$/)) {
            // Numbered section header (e.g., "1. **Accessibility**")
            if (currentParagraph.length > 0) {
              renderedLines.push(
                <p key={`para-${lineIndex}`} className={`${textStyles.body.regular} mb-3`}>
                  <LinkText text={currentParagraph.join(" ")} />
                </p>
              );
              currentParagraph = [];
            }

            const match = trimmedLine.match(/^\d+\.\s+\*\*(.*?)\*\*$/);
            if (match) {
              renderedLines.push(
                <h4
                  key={`subheader-${lineIndex}`}
                  className={`${textStyles.subheading.small} text-foreground mb-2 mt-3`}
                >
                  {match[1]}
                </h4>
              );
            }
          } else if (trimmedLine.length > 0) {
            // Regular paragraph line
            currentParagraph.push(trimmedLine);
          } else {
            // Empty line - flush paragraph
            if (currentParagraph.length > 0) {
              renderedLines.push(
                <p key={`para-${lineIndex}`} className={`${textStyles.body.regular} mb-3`}>
                  <LinkText text={currentParagraph.join(" ")} />
                </p>
              );
              currentParagraph = [];
            }
          }
        });

        // Flush remaining paragraph
        if (currentParagraph.length > 0) {
          renderedLines.push(
            <p key={`para-final`} className={`${textStyles.body.regular} mb-3`}>
              <LinkText text={currentParagraph.join(" ")} />
            </p>
          );
        }

        return (
          <div key={`section-${sectionIndex}`} className="border-b border-border pb-6 last:border-b-0 last:pb-0">
            {renderedLines}
          </div>
        );
      })}
    </div>
  );
}
