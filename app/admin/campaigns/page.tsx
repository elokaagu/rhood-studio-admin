"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
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
import { ArrowRight, Check, Loader2, MapPin, Radar } from "lucide-react";
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
  { id: "action", label: "R/HOOD to act" },
  { id: "waiting", label: "Waiting" },
  { id: "done", label: "Done" },
];

function filterFor(owner: CampaignOwner): Exclude<Filter, "all"> {
  if (owner === "rhood") return "action";
  if (owner === "done") return "done";
  return "waiting";
}

const OWNER_BADGE: Record<CampaignOwner, string> = {
  rhood: "border-orange-400/60 bg-orange-400/10 text-orange-300",
  brand: "border-border bg-muted/40 text-foreground",
  dj: "border-border bg-muted/40 text-foreground",
  replies: "border-border bg-muted/40 text-foreground",
  applicants: "border-border bg-transparent text-muted-foreground",
  done: "border-[#c2cc06]/60 bg-[#c2cc06]/10 text-[#c2cc06]",
};

function OwnerBadge({ owner }: { owner: CampaignOwner }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide whitespace-nowrap ${OWNER_BADGE[owner]}`}
    >
      {OWNER_LABEL[owner]}
    </span>
  );
}

function Pipeline({ campaign }: { campaign: CampaignRow }) {
  const currentIndex = PIPELINE.findIndex((s) => s.id === campaign.step);
  const isDone = campaign.owner === "done";
  return (
    <ol className="grid grid-cols-6 gap-1" aria-label="Campaign progress">
      {PIPELINE.map((stage, index) => {
        const reached = campaign.completed.includes(stage.id);
        const current = !isDone && index === currentIndex;
        const needsUs = current && campaign.owner === "rhood";
        return (
          <li key={stage.id} className="min-w-0">
            <div
              className={`h-1.5 rounded-full ${
                reached
                  ? "bg-[#c2cc06]"
                  : current
                    ? needsUs
                      ? "bg-orange-400 animate-pulse"
                      : "bg-[#c2cc06]/40 animate-pulse"
                    : "bg-muted"
              }`}
            />
            <p
              className={`mt-1.5 truncate text-[10px] uppercase tracking-wide ${
                current
                  ? "text-foreground font-semibold"
                  : reached
                    ? "text-muted-foreground"
                    : "text-muted-foreground/50"
              } ${current ? "block" : "hidden sm:block"}`}
            >
              {stage.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
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
  const [filter, setFilter] = useState<Filter>("all");
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
    const result: Record<Filter, number> = { all: campaigns.length, action: 0, waiting: 0, done: 0 };
    for (const c of campaigns) result[filterFor(c.owner)] += 1;
    return result;
  }, [campaigns]);

  const visible = useMemo(
    () =>
      filter === "all" ? campaigns : campaigns.filter((c) => filterFor(c.owner) === filter),
    [campaigns, filter]
  );

  const selected = campaigns.find((c) => c.opportunityId === selectedId) ?? null;

  const handleIntro = async (placement: CampaignPlacement, action: "send" | "mark") => {
    setBusy(`${placement.applicationId}:${action}`);
    const result = await updateCampaignIntro(placement.applicationId, action);
    setBusy(null);
    if (!result.ok) {
      toast({ title: "Intro not updated", description: result.message, variant: "destructive" });
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
    <div className="sm:p-6 space-y-6">
      <div>
        <h1 className={`${textStyles.headline.section} text-lg sm:text-xl md:text-2xl`}>
          CAMPAIGNS
        </h1>
        <p className={`${textStyles.body.small} text-muted-foreground mt-1`}>
          Where every live listing is, from listing to gig done, and who needs to move it on.
        </p>
      </div>

      {!isLoading && campaigns.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                filter === f.id
                  ? "border-[#c2cc06] bg-[#c2cc06] text-black"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
              <span className="ml-1.5 opacity-70">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <p className={`${textStyles.body.regular} text-muted-foreground`}>Reading campaigns…</p>
      ) : campaigns.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Radar className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className={`${textStyles.body.regular} text-muted-foreground`}>
              No live campaigns yet.
            </p>
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <p className={`${textStyles.body.regular} text-muted-foreground`}>
          Nothing in this view.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((campaign) => {
            const applicants = campaign.placements.length;
            return (
              <Card
                key={campaign.opportunityId}
                className={`bg-card border-border ${
                  campaign.owner === "rhood" ? "border-l-2 border-l-orange-400" : ""
                }`}
              >
                <CardContent className="p-4 space-y-4">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setSelectedId(campaign.opportunityId)}
                  >
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className={`${textStyles.subheading.small} text-foreground truncate`}>
                          {campaign.title}
                        </p>
                        <p className={`${textStyles.body.small} text-muted-foreground mt-0.5`}>
                          {campaign.brandName}
                          {campaign.eventLabel ? ` · ${campaign.eventLabel}` : ""}
                          {` · ${applicants} applicant${applicants === 1 ? "" : "s"}`}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <OwnerBadge owner={campaign.owner} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Pipeline campaign={campaign} />
                    </div>
                    <p className={`${textStyles.body.regular} text-foreground mt-4 break-words`}>
                      {campaign.headline}
                    </p>
                    {campaign.owner !== "done" ? (
                      <p
                        className={`${textStyles.body.small} text-muted-foreground mt-1 flex items-start gap-1.5`}
                      >
                        <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>{campaign.next}</span>
                      </p>
                    ) : null}
                  </button>
                  {campaign.location ? (
                    <p
                      className={`${textStyles.body.small} text-muted-foreground flex items-center gap-1`}
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{campaign.location}</span>
                    </p>
                  ) : null}
                </CardContent>
              </Card>
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
                <OwnerBadge owner={selected.owner} />

                <ol className="space-y-2">
                  {PIPELINE.map((stage) => {
                    const reached = selected.completed.includes(stage.id);
                    const current = selected.owner !== "done" && stage.id === selected.step;
                    return (
                      <li key={stage.id} className="flex items-center gap-3 text-sm">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            reached
                              ? "border-[#c2cc06] bg-[#c2cc06] text-black"
                              : current
                                ? selected.owner === "rhood"
                                  ? "border-orange-400"
                                  : "border-[#c2cc06]"
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
                          {current ? " — in progress" : ""}
                        </span>
                      </li>
                    );
                  })}
                </ol>

                <section>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                    Where we are
                  </p>
                  <p className={`${textStyles.body.regular} text-foreground`}>{selected.headline}</p>
                  {selected.owner !== "done" ? (
                    <p className={`${textStyles.body.small} text-muted-foreground mt-1`}>
                      Next: {selected.next}
                    </p>
                  ) : null}
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
                                      needsIntro ? "text-orange-300" : "text-muted-foreground"
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
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Replies show up here once hello@rhood.io forwards intro replies to Resend.
                  </p>
                </section>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/admin/opportunities/${selected.opportunityId}`)}
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
