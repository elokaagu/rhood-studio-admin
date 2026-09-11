"use client";

import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { googleMapsSearchUrl } from "@/lib/maps";
import { isMappableLocation } from "@/lib/opportunities/location";
import { cn } from "@/lib/utils";

type Props = {
  address: string;
  placeId?: string;
  className?: string;
  showIcon?: boolean;
  children?: ReactNode;
};

export function GoogleMapsLink({
  address,
  placeId,
  className,
  showIcon = true,
  children,
}: Props) {
  if (!isMappableLocation(address)) return null;

  return (
    <a
      href={googleMapsSearchUrl(address, placeId)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-brand-green hover:underline min-w-0",
        className
      )}
    >
      <span className="truncate">{children ?? address}</span>
      {showIcon ? <ExternalLink className="h-3 w-3 shrink-0" /> : null}
    </a>
  );
}
