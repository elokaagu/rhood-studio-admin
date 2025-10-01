"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AlertCircle } from "lucide-react";

interface ImageDisplayProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function ImageDisplay({
  src,
  alt,
  fill = false,
  width,
  height,
  className = "",
  sizes,
  priority = false,
}: ImageDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error("Image load error:", src);
    console.error("Error details:", e);
    setImageError(true);
    setImageLoading(false);
  };

  const handleLoad = () => {
    console.log("Image loaded successfully:", src);
    setImageLoading(false);
  };

  if (imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
      >
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Image failed to load</p>
        </div>
      </div>
    );
  }

  const imageProps = {
    src,
    alt,
    onError: handleError,
    onLoad: handleLoad,
    className: `${className} ${
      imageLoading ? "opacity-0" : "opacity-100"
    } transition-opacity duration-200`,
    priority,
    ...(fill ? { fill: true } : { width, height }),
    ...(sizes && { sizes }),
  };

  return (
    <div className="relative">
      {imageLoading && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-muted animate-pulse ${className}`}
        >
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      )}
      <Image {...imageProps} alt={alt} />
    </div>
  );
}
