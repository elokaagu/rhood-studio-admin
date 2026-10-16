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
  unoptimized?: boolean;
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
  unoptimized = true,
}: ImageDisplayProps) {
  const [imageError, setImageError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground ${className}`}
      >
        <div className="text-center p-2">
          <AlertCircle className="h-6 w-6 mx-auto mb-1 opacity-60" />
          <p className="text-xs">Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-muted ${fill ? "h-full w-full" : ""}`}>
      {!loaded ? (
        <div
          className="absolute inset-0 animate-pulse bg-muted"
          aria-hidden
        />
      ) : null}
      <Image
        src={src}
        alt={alt}
        onError={() => {
          setImageError(true);
          setLoaded(true);
        }}
        onLoad={() => setLoaded(true)}
        className={`${className} transition-[opacity,filter,transform] duration-500 ease-out ${
          loaded
            ? "opacity-100 blur-0 scale-100"
            : "opacity-0 blur-md scale-[1.02]"
        }`}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        unoptimized={unoptimized}
        {...(fill ? { fill: true } : { width, height })}
        {...(sizes ? { sizes } : {})}
      />
    </div>
  );
}
