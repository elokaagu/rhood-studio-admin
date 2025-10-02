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
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
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
  placeholder = "blur",
  blurDataURL,
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

  // Generate a simple blur placeholder if none provided
  const defaultBlurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

  const imageProps = {
    src,
    alt,
    onError: handleError,
    onLoad: handleLoad,
    className: `${className} ${
      imageLoading ? "opacity-0" : "opacity-100"
    } transition-opacity duration-300`,
    priority,
    placeholder,
    blurDataURL: blurDataURL || defaultBlurDataURL,
    loading: (priority ? "eager" : "lazy") as "eager" | "lazy",
    ...(fill ? { fill: true } : { width, height }),
    ...(sizes && { sizes }),
  };

  return (
    <div className="relative overflow-hidden">
      {imageLoading && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm animate-pulse ${className}`}
        >
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      )}
      <Image {...imageProps} alt={alt} />
    </div>
  );
}
