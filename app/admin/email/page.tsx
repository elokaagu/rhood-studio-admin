"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUserProfile } from "@/lib/auth-utils";
import { loginPathWithNext } from "@/lib/auth/login-redirect";
import { formatDate } from "@/lib/date-utils";
import {
  fetchMarketingStatus,
  runMarketingAction,
  type MarketingAction,
} from "@/lib/email/marketing/client";
import {
  MARKETING_DOMAIN,
  MARKETING_FROM,
  MARKETING_REPLY_TO,
  MARKETING_SEGMENTS,
  MARKETING_TOPIC,
  type SegmentKey,
} from "@/lib/email/marketing/config";
import type { EventCounts, MarketingStatus } from "@/lib/email/marketing/types";
import { Check, Copy, ExternalLink, Loader2, Mail, RefreshCw, X } from "lucide-react";

function percent(part: number, whole: number): string {
  if (!whole) return "–";
  return `${Math.round((part / whole) * 100)}%`;
}

function StatusDot({ ok }: { ok: boolean }) {
  return ok ? (
    <Check className="h-4 w-4 text-brand-green shrink-0" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground shrink-0" />
  );
}

function ChecklistRow({ ok, title, detail }: { ok: boolean; title: string; detail: string }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5">
        <StatusDot ok={ok} />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
      </div>
    </li>
  );
}

function StreamStats({ label, counts }: { label: string; counts: EventCounts }) {
  const delivered = counts.delivered || counts.sent;
  const stats = [
    { label: "Delivered", value: String(counts.delivered) },
    { label: "Opened", value: percent(counts.opened, delivered) },
    { label: "Clicked", value: percent(counts.clicked, delivered) },
    { label: "Bounced", value: String(counts.bounced) },
    { label: "Spam reports", value: String(counts.complained) },
  ];
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">{label}</p>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-md border border-border bg-background/40 p-3">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-semibold text-foreground tabular-nums mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EmailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<MarketingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState<MarketingAction | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await fetchMarketingStatus());
    } catch (error) {
      toast({
        title: "Could not load email status",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void (async () => {
      const profile = await getCurrentUserProfile();
      if (!profile) {
        router.push(loginPathWithNext("/admin/email"));
        return;
      }
      if (profile.role !== "admin") {
        router.push("/admin/dashboard");
        return;
      }
      await load();
    })();
  }, [load, router]);

  const run = async (action: MarketingAction, successTitle: string) => {
    setBusy(action);
    try {
      const result = await runMarketingAction(action);
      const sync = (result.sync ?? result) as {
        created?: number;
        updated?: number;
        failed?: number;
      };
      const detail =
        typeof sync.created === "number"
          ? `${sync.created} added, ${sync.updated ?? 0} updated${sync.failed ? `, ${sync.failed} failed` : ""}.`
          : undefined;
      toast({ title: successTitle, description: detail });
      await load();
    } catch (error) {
      toast({
        title: "That didn't work",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(null), 1500);
  };

  const domain = status?.domain ?? null;
  const verified = domain?.status === "verified";
  const setUp = Boolean(status?.setupAt);

  return (
    <div className="space-y-4 sm:space-y-6 animate-blur-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={textStyles.headline.page}>EMAIL</h1>
          <p className={`${textStyles.body.small} text-muted-foreground mt-1`}>
            Marketing emails to DJs, brands and the mailing list, sent through Resend.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="https://resend.com/broadcasts" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Resend
            </a>
          </Button>
          <Button
            className="bg-brand-green text-brand-black hover:bg-brand-green/90"
            disabled={Boolean(busy)}
            onClick={() => void run("setup", setUp ? "Setup refreshed" : "Resend is set up")}
          >
            {busy === "setup" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {setUp ? "Re-run setup" : "Run setup"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className={`${textStyles.body.regular} text-muted-foreground`}>Loading…</p>
      ) : !status ? null : (
        <>
          {status.errors.length > 0 ? (
            <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
              {status.errors.join(" ")}
            </div>
          ) : null}

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-foreground">Setup</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                <ChecklistRow
                  ok={status.configured.resendKey}
                  title="Resend account connected"
                  detail={
                    status.configured.resendKey
                      ? "Studio is using the R/HOOD Resend account."
                      : "RESEND_API_KEY is missing on this deployment."
                  }
                />
                <ChecklistRow
                  ok={verified}
                  title={`Sending domain ${MARKETING_DOMAIN}`}
                  detail={
                    !domain
                      ? "Run setup to create it."
                      : verified
                        ? `Verified. Marketing emails send as ${MARKETING_FROM}.`
                        : "Waiting for the DNS records below to be added in GoDaddy."
                  }
                />
                <ChecklistRow
                  ok={Boolean(domain?.openTracking && domain?.clickTracking)}
                  title="Open and click tracking"
                  detail={
                    domain?.trackingSubdomain
                      ? `Links are tracked through ${domain.trackingSubdomain}.${MARKETING_DOMAIN}.`
                      : "Turned on by setup."
                  }
                />
                <ChecklistRow
                  ok={status.webhook.connected}
                  title="Delivery and engagement events"
                  detail={
                    status.webhook.connected
                      ? "Resend reports deliveries, opens, clicks and bounces back to Studio."
                      : "Run setup to connect the webhook."
                  }
                />
                <ChecklistRow
                  ok={status.configured.cronSecret}
                  title="Daily contact sync"
                  detail={
                    status.configured.cronSecret
                      ? "New and changed Studio users are pushed to Resend every morning."
                      : "CRON_SECRET is missing on Vercel, so the daily sync can't run. Use Sync now meanwhile."
                  }
                />
              </ul>
            </CardContent>
          </Card>

          {domain && !verified ? (
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3 space-y-0">
                <CardTitle className="text-base text-foreground">DNS records to add</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={Boolean(busy)}
                  onClick={() => void run("check_domain", "DNS checked")}
                >
                  {busy === "check_domain" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Check DNS
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  In GoDaddy, open DNS for rhood.io and add each record. GoDaddy adds
                  &ldquo;.rhood.io&rdquo; to the name for you, so enter only the part before it. Records
                  can take up to an hour to verify.
                </p>
                <div className="space-y-2">
                  {domain.records.map((record) => {
                    const host = record.name.replace(/\.rhood\.io\.?$/i, "");
                    return (
                      <div
                        key={`${record.record}-${record.name}-${record.type}`}
                        className="rounded-md border border-border bg-background/40 p-3"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="font-semibold text-foreground">{record.type}</span>
                          <span className="text-muted-foreground">{record.record}</span>
                          {record.priority !== undefined ? (
                            <span className="text-muted-foreground">priority {record.priority}</span>
                          ) : null}
                          <span
                            className={`ml-auto ${record.status === "verified" ? "text-brand-green" : "text-muted-foreground"}`}
                          >
                            {record.status === "verified" ? "Verified" : "Not found yet"}
                          </span>
                        </div>
                        {[
                          { label: "Name", value: host },
                          { label: "Value", value: record.value },
                        ].map((field) => (
                          <div key={field.label} className="mt-2 flex items-start gap-2">
                            <span className="w-12 shrink-0 text-xs text-muted-foreground pt-0.5">
                              {field.label}
                            </span>
                            <code className="flex-1 min-w-0 break-all text-xs text-foreground">
                              {field.value}
                            </code>
                            <button
                              type="button"
                              className="shrink-0 text-muted-foreground hover:text-foreground"
                              onClick={() => void copy(field.value)}
                              aria-label={`Copy ${field.label.toLowerCase()}`}
                            >
                              {copied === field.value ? (
                                <Check className="h-3.5 w-3.5 text-brand-green" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-base text-foreground">Contacts</CardTitle>
              <Button
                variant="outline"
                size="sm"
                disabled={Boolean(busy) || !setUp}
                onClick={() => void run("sync", "Contacts synced")}
              >
                {busy === "sync" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Sync now
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["everyone", "djs", "brands", "team"] as SegmentKey[]).map((key) => (
                  <div key={key} className="rounded-md border border-border bg-background/40 p-3">
                    <p className="text-xs text-muted-foreground">{MARKETING_SEGMENTS[key]}</p>
                    <p className="text-lg font-semibold text-foreground tabular-nums mt-0.5">
                      {status.contacts.bySegment[key]}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {status.contacts.lastSync
                  ? `Last synced ${formatDate(status.contacts.lastSync.at)}.`
                  : "Not synced yet."}{" "}
                DJs only join the DJs segment once they&apos;re approved.
                {status.contacts.failed > 0
                  ? ` ${status.contacts.failed} contacts failed to sync and will be retried.`
                  : ""}
              </p>
              <div className="rounded-md border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                <p className="text-sm text-foreground mb-1">Importing the mailing list</p>
                In Resend, go to Audience, then Add contacts, then Import CSV, and choose the{" "}
                <strong className="text-foreground">{MARKETING_SEGMENTS.mailing_list}</strong> segment.
                Only import people who agreed to hear from R/HOOD.
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-foreground">Last 30 days</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <StreamStats label="Marketing emails" counts={status.last30Days.marketing} />
              <StreamStats
                label="Product emails (approvals, bookings, invites)"
                counts={status.last30Days.product}
              />
              <p className="text-xs text-muted-foreground">
                Opens and clicks are only tracked on marketing emails, so product emails stay out of
                promotions folders. Open rates undercount because some inboxes block tracking images.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-foreground">Broadcasts</CardTitle>
            </CardHeader>
            <CardContent>
              {status.broadcasts.length === 0 ? (
                <div className="py-8 text-center">
                  <Mail className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No broadcasts yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="py-2 pr-3 font-normal">Broadcast</th>
                        <th className="py-2 px-3 font-normal">Sent</th>
                        <th className="py-2 px-3 font-normal text-right">Delivered</th>
                        <th className="py-2 px-3 font-normal text-right">Opened</th>
                        <th className="py-2 px-3 font-normal text-right">Clicked</th>
                        <th className="py-2 px-3 font-normal text-right">Unsubscribed</th>
                        <th className="py-2 pl-3 font-normal text-right">Bounced</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {status.broadcasts.map((b) => (
                        <tr key={b.id}>
                          <td className="py-2.5 pr-3 text-foreground">
                            <a
                              href={`https://resend.com/broadcasts/${b.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline"
                            >
                              {b.name || "Untitled"}
                            </a>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                            {b.sentAt
                              ? formatDate(b.sentAt)
                              : b.scheduledAt
                                ? `Scheduled ${formatDate(b.scheduledAt)}`
                                : b.status === "draft"
                                  ? "Draft"
                                  : b.status}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums">{b.counts.delivered}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            {percent(b.counts.opened, b.counts.delivered)}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            {percent(b.counts.clicked, b.counts.delivered)}
                          </td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            {b.unsubscribed === null ? "–" : b.unsubscribed >= 100 ? "100+" : b.unsubscribed}
                          </td>
                          <td className="py-2.5 pl-3 text-right tabular-nums">{b.counts.bounced}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {status.topLinks && status.topLinks.links.length > 0 ? (
                <div className="mt-5">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                    Top links in {status.topLinks.broadcastName}
                  </p>
                  <ul className="space-y-1.5">
                    {status.topLinks.links.map((link) => (
                      <li key={link.url} className="flex items-center gap-3 text-sm">
                        <span className="flex-1 min-w-0 truncate text-foreground">{link.url}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {link.uniqueClicks} people · {link.clicks} clicks
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-foreground">Sending a broadcast</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal pl-5 space-y-1.5 text-sm text-muted-foreground">
                <li>
                  In Resend, open Broadcasts and create a new one. Send from{" "}
                  <span className="text-foreground">{MARKETING_FROM}</span> with reply-to{" "}
                  <span className="text-foreground">{MARKETING_REPLY_TO}</span>.
                </li>
                <li>
                  Pick a segment (for example DJs) and the{" "}
                  <span className="text-foreground">{MARKETING_TOPIC.name}</span> topic, so people
                  can unsubscribe from updates without losing booking emails.
                </li>
                <li>
                  Greet people by name with{" "}
                  <code className="text-foreground">{"{{{contact.display_name|there}}}"}</code>.
                </li>
                <li>
                  Send it to the <span className="text-foreground">{MARKETING_SEGMENTS.team}</span>{" "}
                  segment first to check it, then send to the real segment. Results show up here.
                </li>
              </ol>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
