"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import {
  fetchDjApplications,
  membershipSourceLabel,
  setDjMembershipStatus,
} from "@/lib/admin/dj-applications/service";
import type {
  DjApplication,
  DjMembershipStatus,
} from "@/lib/admin/dj-applications/types";
import { setContactOnboardingByEmail } from "@/lib/crm/service";
import {
  CheckCircle,
  Clock,
  Eye,
  MapPin,
  Search,
  XCircle,
} from "lucide-react";

function getInitials(name: string) {
  if (!name.trim()) return "DJ";
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

async function notifyMembershipDecision(app: DjApplication, status: "approved" | "rejected") {
  try {
    await fetch("/api/notifications/dj-membership-decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: app.email,
        name: app.name,
        status,
      }),
    });
  } catch {
    /* email is best-effort */
  }
}

export default function DjApplicationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [applications, setApplications] = useState<DjApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [schemaReady, setSchemaReady] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "approved" | "rejected" | "all"
  >("pending");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchDjApplications();
    if (!result.ok) {
      toast({
        title: "Unable to load applications",
        description: result.message,
        variant: "destructive",
      });
      setApplications([]);
      setSchemaReady(result.schemaReady !== false);
      setIsLoading(false);
      return;
    }
    setSchemaReady(result.schemaReady);
    setApplications(result.data);
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return applications.filter((app) => {
      const matchesStatus =
        statusFilter === "all" || app.membershipStatus === statusFilter;
      const matchesSearch =
        !q ||
        app.name.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q) ||
        (app.djName || "").toLowerCase().includes(q) ||
        (app.city || "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [applications, searchTerm, statusFilter]);

  const pendingCount = applications.filter((a) => a.membershipStatus === "pending").length;

  const handleStatus = async (app: DjApplication, status: DjMembershipStatus) => {
    setUpdatingId(app.id);
    const result = await setDjMembershipStatus(
      app.id,
      status,
      status === "pending" ? "application" : app.membershipSource ?? "application"
    );
    if (!result.ok) {
      toast({
        title: "Update failed",
        description: result.message,
        variant: "destructive",
      });
      setUpdatingId(null);
      return;
    }

    setApplications((prev) =>
      prev.map((item) =>
        item.id === app.id ? { ...item, membershipStatus: status } : item
      )
    );

    if (status === "approved" || status === "rejected") {
      await notifyMembershipDecision(app, status);
      await setContactOnboardingByEmail(
        app.email,
        status === "approved" ? "Onboarded" : "Inactive",
        status === "approved"
          ? "Approved for R/HOOD (invite-only community)."
          : "DJ application rejected."
      );
    }

    toast({
      title:
        status === "approved"
          ? "DJ approved"
          : status === "rejected"
            ? "DJ rejected"
            : "Moved to pending",
      description:
        status === "pending"
          ? `${app.name} will stay in the queue until you decide.`
          : `${app.name} has been ${status}.`,
    });
    setUpdatingId(null);
  };

  const statusBadge = (status: DjMembershipStatus) => {
    if (status === "approved") {
      return (
        <Badge className="bg-transparent text-brand-green border-brand-green text-xs">
          Approved
        </Badge>
      );
    }
    if (status === "rejected") {
      return (
        <Badge className="bg-transparent text-red-400 border-red-400 text-xs">
          Rejected
        </Badge>
      );
    }
    return (
      <Badge className="bg-transparent text-yellow-400 border-yellow-500 text-xs">
        Pending
      </Badge>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-blur-in">
      <div>
        <h1 className="font-ts-block ts-xl uppercase text-left text-brand-white text-lg sm:text-xl md:text-2xl">
          DJ Applications
        </h1>
        <p className={`${textStyles.body.regular} text-sm sm:text-base`}>
          Invite-only community queue. Invited DJs skip this list. App applicants wait here until you approve, reject, or leave them pending.
        </p>
      </div>

      {!schemaReady && (
        <p className="text-sm text-yellow-400">
          Run supabase/migrations/20260910191000_studio_dj_application_queue.sql in the Studio SQL editor so this queue can load and save decisions.
        </p>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applicants..."
            className="pl-10 bg-secondary border-border text-foreground"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["pending", `Pending${pendingCount ? ` (${pendingCount})` : ""}`],
              ["approved", "Approved"],
              ["rejected", "Rejected"],
              ["all", "All"],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              variant="outline"
              size="sm"
              className={`text-xs sm:text-sm ${
                statusFilter === value
                  ? "bg-brand-green text-brand-black hover:bg-brand-green/90"
                  : ""
              }`}
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {statusFilter === "pending"
                ? "No pending DJ applications."
                : "No DJ applications match this filter."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => (
            <Card key={app.id} className="bg-card border-border">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <Avatar className="h-10 w-10 sm:h-12 sm:w-12 bg-brand-green flex-shrink-0">
                      <AvatarImage
                        src={app.profileImageUrl ?? undefined}
                        alt={app.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-brand-black font-bold text-xs sm:text-sm">
                        {getInitials(app.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`${textStyles.subheading.large} text-base sm:text-lg truncate`}>
                          {app.djName || app.name}
                        </h3>
                        {statusBadge(app.membershipStatus)}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {app.email}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground mt-2">
                        {app.city && (
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {app.city}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Applied {app.appliedAtLabel}
                        </span>
                        <span>{membershipSourceLabel(app.membershipSource)}</span>
                      </div>
                      {app.bio && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {app.bio}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm"
                      onClick={() => router.push(`/admin/members/${app.id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    {app.membershipStatus === "pending" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-brand-green text-brand-green hover:bg-brand-green hover:text-brand-black text-xs sm:text-sm"
                          disabled={updatingId === app.id}
                          onClick={() => void handleStatus(app, "approved")}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-400 text-xs sm:text-sm"
                          disabled={updatingId === app.id}
                          onClick={() => void handleStatus(app, "rejected")}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {app.membershipStatus !== "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs sm:text-sm"
                        disabled={updatingId === app.id}
                        onClick={() => void handleStatus(app, "pending")}
                      >
                        Leave pending
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
