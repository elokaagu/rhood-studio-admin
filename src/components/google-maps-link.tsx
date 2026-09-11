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
  /** Single-line ellipsis. Default wraps so long addresses stay in the cell. */
  truncate?: boolean;
};

export function GoogleMapsLink({
  address,
  placeId,
  className,
  showIcon = true,
  children,
  truncate = false,
}: Props) {
  if (!isMappableLocation(address)) return null;

  return (
    <a
      href={googleMapsSearchUrl(address, placeId)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex max-w-full min-w-0 items-start gap-1 text-brand-green hover:underline",
        className
      )}
    >
      <span
        className={cn(
          "min-w-0",
          truncate ? "min-w-0 flex-1 truncate" : "min-w-0 break-words [overflow-wrap:anywhere]"
        )}
      >
        {children ?? address}
      </span>
      {showIcon ? <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" /> : null}
    </a>
  );
}
