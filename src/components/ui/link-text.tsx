"use client";

import React from "react";

interface LinkTextProps {
  text: string;
  className?: string;
}

/**
 * Component that renders text with clickable links.
 * Parses markdown-style links [text](url) and renders them as underlined, highlighted links.
 */
export function LinkText({ text, className = "" }: LinkTextProps) {
  // Regex to match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  const parts: (string | { text: string; url: string })[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the link
    parts.push({
      text: match[1],
      url: match[2],
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last link
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no links found, return plain text
  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (typeof part === "string") {
          return <span key={index}>{part}</span>;
        } else {
          return (
            <a
              key={index}
              href={part.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.preventDefault();
                window.open(part.url, "_blank", "noopener,noreferrer");
              }}
              className="underline decoration-primary decoration-2 underline-offset-2 text-primary hover:text-primary/80 transition-colors bg-primary/20 px-1 rounded"
              style={{
                textDecorationColor: "#C2CC06",
                textDecorationThickness: "2px",
                backgroundColor: "rgba(194, 204, 6, 0.2)",
              }}
            >
              {part.text}
            </a>
          );
        }
      })}
    </span>
  );
}

