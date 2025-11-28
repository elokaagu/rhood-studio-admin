"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variant?: "fade-in" | "fade-in-up" | "blur-in";
}

/**
 * PageWrapper component that provides smooth loading animations for page content
 * Usage: Wrap page content with <PageWrapper>...</PageWrapper>
 */
export function PageWrapper({
  children,
  className,
  delay = 0,
  variant = "fade-in",
}: PageWrapperProps) {
  const animationClass =
    variant === "fade-in-up"
      ? "animate-fade-in-up"
      : variant === "blur-in"
      ? "animate-blur-in"
      : "animate-fade-in";

  return (
    <div
      className={cn(animationClass, className)}
      style={delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

