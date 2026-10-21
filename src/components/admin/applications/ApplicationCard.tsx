"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/lib/typography";
import type { ApplicationListItem } from "@/lib/applications/types";
import { ImageDisplay } from "@/components/ui/image-display";
import {
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ImageOff,
} from "lucide-react";

type Props = {
  application: ApplicationListItem;
  variant: "grid" | "list";
  isUpdating?: boolean;
  onView: (id: string) => void;
  onApprove: (application: ApplicationListItem) => void;
  onReject: (application: ApplicationListItem) => void;
  onCompleteGig: (application: ApplicationListItem) => void;
};

function StatusBadge({ status }: { status: string }) {
  const Icon =
    status === "approved"
      ? CheckCircle
      : status === "rejected"
        ? XCircle
        : Clock;
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge
      variant="outline"
      className="border-white/20 text-white bg-black/55 backdrop-blur-md text-xs font-medium"
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="ml-1">{label}</span>
    </Badge>
  );
}

function ActionButtons({
  application,
  isUpdating,
  onView,
  onApprove,
  onReject,
  onCompleteGig,
  compact,
}: {
  application: ApplicationListItem;
  isUpdating?: boolean;
  onView: (id: string) => void;
  onApprove: (application: ApplicationListItem) => void;
  onReject: (application: ApplicationListItem) => void;
  onCompleteGig: (application: ApplicationListItem) => void;
  compact?: boolean;
}) {
  const size = compact ? "sm" : "sm";
  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "w-full"}`}>
      <Button
        variant="outline"
        size={size}
        className="text-foreground text-xs border-border/80 bg-black/40 hover:bg-black/60"
        onClick={() => onView(application.id)}
      >
        <Eye className="h-3.5 w-3.5 mr-1" />
        View
      </Button>
      {application.status === "pending" && (
        <>
          <Button
            variant="outline"
            size={size}
            className="border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-black transition-all duration-200 text-xs font-medium"
            onClick={() => onApprove(application)}
            disabled={isUpdating}
          >
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Approve
          </Button>
          <Button
            variant="outline"
            size={size}
            className="border-red-500/40 text-red-500 hover:bg-red-500/10 text-xs"
            onClick={() => onReject(application)}
            disabled={isUpdating}
          >
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Reject
          </Button>
        </>
      )}
      {application.status === "approved" && !application.gig_completed && (
        <Button
          variant="outline"
          size={size}
          className="border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-black transition-all duration-200 text-xs font-medium"
          onClick={() => onCompleteGig(application)}
          disabled={isUpdating}
        >
          <CheckCircle className="h-3.5 w-3.5 mr-1" />
          Mark Gig Done
        </Button>
      )}
    </div>
  );
}

export function ApplicationCard({
  application,
  variant,
  isUpdating,
  onView,
  onApprove,
  onReject,
  onCompleteGig,
}: Props) {
  if (variant === "list") {
    return (
      <Card className="bg-card border-border overflow-hidden hover:border-brand-green/30 transition-colors">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row sm:items-stretch gap-0">
            <div className="relative w-full sm:w-40 md:w-48 h-36 sm:h-auto sm:min-h-[7.5rem] shrink-0 bg-muted">
              {application.opportunityImageUrl ? (
                <ImageDisplay
                  src={application.opportunityImageUrl}
                  alt={application.opportunity}
                  fill
                  className="object-cover"
                  sizes="192px"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <ImageOff className="h-6 w-6 opacity-50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/40 sm:bg-gradient-to-r sm:from-transparent sm:to-black/50" />
            </div>

            <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3 p-4 min-w-0">
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={application.status} />
                </div>
                <h3 className={`${textStyles.subheading.large} text-base truncate`}>
                  {application.opportunity}
                </h3>
                <p className="text-sm text-foreground/90 truncate">
                  {application.applicant.name}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {application.appliedDate}
                  </span>
                  <span className="inline-flex items-center gap-1 min-w-0">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{application.applicant.location}</span>
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <ActionButtons
                  application={application}
                  isUpdating={isUpdating}
                  onView={onView}
                  onApprove={onApprove}
                  onReject={onReject}
                  onCompleteGig={onCompleteGig}
                  compact
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group bg-card border-border overflow-hidden flex flex-col hover:border-brand-green/35 transition-all duration-300 hover:shadow-[0_0_0_1px_rgba(180,255,57,0.12)]">
      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
        {application.opportunityImageUrl ? (
          <ImageDisplay
            src={application.opportunityImageUrl}
            alt={application.opportunity}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-secondary">
            <ImageOff className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-xs">No artwork</p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-green/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          <StatusBadge status={application.status} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <p className="text-[11px] uppercase tracking-[0.18em] text-brand-green/90 font-medium">
            Application
          </p>
          <h3 className="font-ts-block text-lg sm:text-xl uppercase leading-tight text-white line-clamp-2">
            {application.opportunity}
          </h3>
          <p className="text-sm text-white/85 font-medium truncate">
            {application.applicant.name}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/65 pt-0.5">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {application.appliedDate}
            </span>
            <span className="inline-flex items-center gap-1 min-w-0">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{application.applicant.location}</span>
            </span>
          </div>
        </div>
      </div>

      <CardContent className="p-3 bg-black/40 border-t border-white/5">
        <ActionButtons
          application={application}
          isUpdating={isUpdating}
          onView={onView}
          onApprove={onApprove}
          onReject={onReject}
          onCompleteGig={onCompleteGig}
        />
      </CardContent>
    </Card>
  );
}
