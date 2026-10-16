"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUserProfile } from "@/lib/auth-utils";
import { loginPathWithNext } from "@/lib/auth/login-redirect";
import { formatDate } from "@/lib/date-utils";
import {
  fetchCampaignBoard,
  updateCampaignIntro,
} from "@/lib/campaigns/fetch-campaigns";
import {
  OWNER_LABEL,
  PIPELINE,
  type CampaignOwner,
  type CampaignPlacement,
  type CampaignRow,
} from "@/lib/campaigns/status";
import { Check, ChevronRight, Loader2, Radar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Filter = "all" | "action" | "waiting" | "done";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "action", label: "Needs us" },
  { id: "waiting", label: "Waiting" },
  { id: "done", label: "Done" },
];

function filterFor(owner: CampaignOwner): Exclude<Filter, "all"> {
  if (owner === "rhood") return "action";
  if (owner === "done") return "done";
  return "waiting";
}

function ownerShort(owner: CampaignOwner): string {
  if (owner === "rhood") return "Needs us";
  if (owner === "done") return "Done";
  return OWNER_LABEL[owner].replace(/^Waiting on /, "");
}

function ownerTone(owner: CampaignOwner): string {
  if (owner === "rhood") return "text-brand-green";
  if (owner === "done") return "text-muted-foreground";
  return "text-foreground/80";
}

function placementState(p: CampaignPlacement): string {
  if (p.status === "pending") return "Waiting for review";
  if (p.status === "rejected") return "Rejected";
  if (p.gigCompleted) return "Gig done";
  if (p.lastReplyFrom === "dj") return "DJ replied";
  if (p.lastReplyFrom === "brand") return "Brand replied";
  if (p.introAt) {
    return p.introSource === "marked"
      ? "Intro marked as sent"
      : `Intro sent ${formatDate(p.introAt)}`;
  }
  return "Approved — no intro on record";
}

export default function CampaignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("action");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(
    async (quiet = false) => {
      const profile = await getCurrentUserProfile();
      if (!profile) {
        router.push(loginPathWithNext("/admin/campaigns"));
        return;
      }
      if (profile.role !== "admin") {
        toast({
          title: "R/HOOD team only",
          description: "Campaign status is for the R/HOOD ops team.",
          variant: "destructive",
        });
        router.push("/admin/dashboard");
        return;
      }
      if (!quiet) setIsLoading(true);
      const result = await fetchCampaignBoard();
      if (!result.ok) {
        toast({
          title: "Could not load campaigns",
          description: result.message,
          variant: "destructive",
        });
        setCampaigns([]);
      } else {
        setCampaigns(result.campaigns);
      }
      setIsLoading(false);
    },
    [router, toast]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const result: Record<Filter, number> = {
      all: campaigns.length,
      action: 0,
      waiting: 0,
      done: 0,
    };
    for (const c of campaigns) result[filterFor(c.owner)] += 1;
    return result;
  }, [campaigns]);

  const visible = useMemo(
    () =>
      filter === "all"
        ? campaigns
        : campaigns.filter((c) => filterFor(c.owner) === filter),
    [campaigns, filter]
  );

  const selected = campaigns.find((c) => c.opportunityId === selectedId) ?? null;

  const handleIntro = async (
    placement: CampaignPlacement,
    action: "send" | "mark"
  ) => {
    setBusy(`${placement.applicationId}:${action}`);
    const result = await updateCampaignIntro(placement.applicationId, action);
    setBusy(null);
    if (!result.ok) {
      toast({
        title: "Intro not updated",
        description: result.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: action === "send" ? "Intro sent" : "Intro marked as sent",
      description:
        action === "send"
          ? `${placement.djName} and the brand are now on a thread with hello@rhood.io.`
          : `Recorded that ${placement.djName}'s intro already went out.`,
    });
    await load(true);
  };

  return (
    <div className="sm:p-6 space-y-5">
      <div>
        <h1 className={`${textStyles.headline.section} text-lg sm:text-xl md:text-2xl`}>
          CAMPAIGNS
        </h1>
        <p className={`${textStyles.body.small} text-muted-foreground mt-1`}>
          Who needs to move each listing next.
        </p>
      </div>

      {!isLoading && campaigns.length > 0 ? (
        <div
          className="flex gap-5 border-b border-border overflow-x-auto"
          role="tablist"
          aria-label="Campaign filters"
        >
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={`shrink-0 pb-2.5 text-sm transition border-b-2 -mb-px ${
                  active
                    ? "border-brand-green text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
                <span className="ml-1.5 tabular-nums text-muted-foreground">
                  {counts[f.id]}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {isLoading ? (
        <p className={`${textStyles.body.regular} text-muted-foreground`}>
          Reading campaigns…
        </p>
      ) : campaigns.length === 0 ? (
        <div className="py-16 text-center">
          <Radar className="h-7 w-7 mx-auto text-muted-foreground mb-3" />
          <p className={`${textStyles.body.regular} text-muted-foreground`}>
            No live campaigns yet.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <p className={`${textStyles.body.regular} text-muted-foreground py-8`}>
          Nothing in this view.
        </p>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {visible.map((campaign) => {
            const applicants = campaign.placements.length;
            const needsUs = campaign.owner === "rhood";
            return (
              <button
                key={campaign.opportunityId}
                type="button"
                onClick={() => setSelectedId(campaign.opportunityId)}
                className="group w-full text-left px-1 py-3.5 sm:px-2 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      needsUs
                        ? "bg-brand-green"
                        : campaign.owner === "done"
                          ? "bg-muted-foreground/40"
                          : "bg-transparent ring-1 ring-border"
                    }`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-sm sm:text-[15px] font-medium text-foreground truncate">
                        {campaign.title}
                      </p>
                      <span
                        className={`shrink-0 text-xs font-medium uppercase tracking-wide ${ownerTone(campaign.owner)}`}
                      >
                        {ownerShort(campaign.owner)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {campaign.brandName}
                      {campaign.eventLabel ? ` · ${campaign.eventLabel}` : ""}
                      {` · ${applicants} applicant${applicants === 1 ? "" : "s"}`}
                    </p>
                    <p className="mt-1.5 text-sm text-foreground/90 line-clamp-1">
                      {campaign.next}
                    </p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="bg-card border-border max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{selected.title}</DialogTitle>
                <DialogDescription>
                  {selected.brandName}
                  {selected.brandEmail ? ` · ${selected.brandEmail}` : ""}
                  {selected.eventLabel ? ` · ${selected.eventLabel}` : ""}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5 pt-2">
                <div>
                  <p className={`text-sm font-medium ${ownerTone(selected.owner)}`}>
                    {OWNER_LABEL[selected.owner]}
                  </p>
                  <p className={`${textStyles.body.regular} text-foreground mt-1`}>
                    {selected.headline}
                  </p>
                  {selected.owner !== "done" ? (
                    <p className={`${textStyles.body.small} text-muted-foreground mt-1`}>
                      Next: {selected.next}
                    </p>
                  ) : null}
                </div>

                <section>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                    Pipeline
                  </p>
                  <ol className="space-y-2">
                    {PIPELINE.map((stage) => {
                      const reached = selected.completed.includes(stage.id);
                      const current =
                        selected.owner !== "done" && stage.id === selected.step;
                      return (
                        <li key={stage.id} className="flex items-center gap-3 text-sm">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              reached
                                ? "border-brand-green bg-brand-green text-brand-black"
                                : current
                                  ? "border-brand-green"
                                  : "border-border"
                            }`}
                          >
                            {reached ? <Check className="h-3 w-3" /> : null}
                          </span>
                          <span
                            className={
                              current
                                ? "font-semibold text-foreground"
                                : reached
                                  ? "text-muted-foreground"
                                  : "text-muted-foreground/60"
                            }
                          >
                            {stage.label}
                            {current ? " — now" : ""}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </section>

                <section>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                    DJs
                  </p>
                  {selected.placements.length === 0 ? (
                    <p className={`${textStyles.body.small} text-muted-foreground`}>
                      No applications yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {[...selected.placements]
                        .sort((a, b) => {
                          const order = { approved: 0, pending: 1, rejected: 2 };
                          return order[a.status] - order[b.status];
                        })
                        .map((p) => {
                          const needsIntro = p.status === "approved" && !p.introAt;
                          return (
                            <li
                              key={p.applicationId}
                              className="rounded-md border border-border bg-background/40 p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm text-foreground truncate">{p.djName}</p>
                                  <p
                                    className={`text-xs mt-0.5 ${
                                      needsIntro
                                        ? "text-brand-green"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {placementState(p)}
                                  </p>
                                </div>
                                <Link
                                  href={`/admin/applications/${p.applicationId}`}
                                  className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:underline"
                                >
                                  Open
                                </Link>
                              </div>
                              {needsIntro ? (
                                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                  <Button
                                    size="sm"
                                    className="bg-brand-green text-brand-black hover:bg-brand-green/90 flex-1"
                                    disabled={Boolean(busy)}
                                    onClick={() => void handleIntro(p, "send")}
                                  >
                                    {busy === `${p.applicationId}:send` ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Send intro"
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    disabled={Boolean(busy)}
                                    onClick={() => void handleIntro(p, "mark")}
                                  >
                                    {busy === `${p.applicationId}:mark` ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Already sent"
                                    )}
                                  </Button>
                                </div>
                              ) : null}
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </section>

                <section>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                    Intro thread
                  </p>
                  {selected.emails.length === 0 ? (
                    <p className={`${textStyles.body.small} text-muted-foreground`}>
                      Nothing logged on the hello@rhood.io thread yet.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {[...selected.emails]
                        .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
                        .slice(0, 8)
                        .map((email) => (
                          <li
                            key={email.id}
                            className="rounded-md border border-border bg-background/40 p-2"
                          >
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              {email.sender === "rhood"
                                ? "R/HOOD sent"
                                : email.sender === "brand"
                                  ? "Brand replied"
                                  : email.sender === "dj"
                                    ? "DJ replied"
                                    : "Reply"}
                              {` · ${formatDate(email.receivedAt)}`}
                            </p>
                            {email.subject ? (
                              <p className="text-xs text-foreground mt-0.5 break-words">
                                {email.subject}
                              </p>
                            ) : null}
                            {email.direction === "inbound" && email.bodyText ? (
                              <p
                                className={`${textStyles.body.small} text-muted-foreground mt-1 line-clamp-3`}
                              >
                                {email.bodyText}
                              </p>
                            ) : null}
                          </li>
                        ))}
                    </ul>
                  )}
                </section>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    router.push(`/admin/opportunities/${selected.opportunityId}`)
                  }
                >
                  Open listing
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
