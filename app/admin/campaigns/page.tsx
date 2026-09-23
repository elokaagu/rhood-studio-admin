"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { textStyles } from "@/lib/typography";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUserProfile } from "@/lib/auth-utils";
import { loginPathWithNext } from "@/lib/auth/login-redirect";
import {
  fetchCampaignBoard,
  type CampaignBoardRow,
} from "@/lib/campaigns/fetch-campaigns";
import { stageLabel, type TrafficLight } from "@/lib/campaigns/status";
import { Check, Circle, MapPin, Radar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const LIGHT_CLASS: Record<TrafficLight, string> = {
  green: "bg-[#c2cc06] shadow-[0_0_12px_rgba(194,204,6,0.55)]",
  yellow: "bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.45)]",
  red: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]",
};

const LIGHT_TEXT: Record<TrafficLight, string> = {
  green: "On track",
  yellow: "Needs a look",
  red: "Stuck",
};

export default function CampaignsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<CampaignBoardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<CampaignBoardRow | null>(null);

  const load = useCallback(async () => {
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
    setIsLoading(true);
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
  }, [router, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className={textStyles.headline.section}>CAMPAIGNS</h1>
        <p className={`${textStyles.body.small} text-muted-foreground mt-1`}>
          Traffic-light status for the R/HOOD team. Click a light for where we
          are now — from Studio steps and the hello@rhood.io campaign thread.
        </p>
      </div>

      {isLoading ? (
        <p className={`${textStyles.body.regular} text-muted-foreground`}>
          Reading campaigns…
        </p>
      ) : campaigns.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Radar className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className={`${textStyles.body.regular} text-muted-foreground`}>
              No live campaigns yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <Card key={campaign.opportunityId} className="bg-card border-border">
              <CardContent className="p-4 flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => setSelected(campaign)}
                  className="shrink-0 mt-1 flex flex-col items-center gap-1 group"
                  aria-label={`${stageLabel(campaign.stage)} — ${LIGHT_TEXT[campaign.light]}. Open status update.`}
                >
                  <span
                    className={`h-8 w-8 rounded-full ring-2 ring-black/40 group-hover:scale-105 transition ${LIGHT_CLASS[campaign.light]}`}
                  />
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {LIGHT_TEXT[campaign.light]}
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    className="text-left w-full"
                    onClick={() => setSelected(campaign)}
                  >
                    <p className={`${textStyles.subheading.small} text-foreground`}>
                      {campaign.title}
                    </p>
                    <p className={`${textStyles.body.small} text-muted-foreground mt-0.5`}>
                      {campaign.brandName}
                      {campaign.eventLabel ? ` · ${campaign.eventLabel}` : ""}
                      {` · ${campaign.pending + campaign.approved + campaign.rejected} applicant${campaign.pending + campaign.approved + campaign.rejected === 1 ? "" : "s"}`}
                    </p>
                    <p className={`${textStyles.body.regular} text-foreground mt-2`}>
                      {campaign.briefing}
                    </p>
                  </button>
                  {campaign.location ? (
                    <p className={`${textStyles.body.small} text-muted-foreground mt-2 flex items-center gap-1`}>
                      <MapPin className="h-3.5 w-3.5" />
                      {campaign.location}
                    </p>
                  ) : null}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 hidden sm:inline-flex"
                  onClick={() =>
                    router.push(`/admin/opportunities/${campaign.opportunityId}`)
                  }
                >
                  Listing
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className={`h-4 w-4 rounded-full ${LIGHT_CLASS[selected.light]}`} />
                  {selected.title}
                </DialogTitle>
                <DialogDescription>
                  {stageLabel(selected.stage)} · {selected.brandName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <section>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                    Where we are right now
                  </p>
                  <p className={`${textStyles.body.regular} text-foreground`}>
                    {selected.briefing}
                  </p>
                </section>
                <section>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                    What needs to happen next
                  </p>
                  <p className={`${textStyles.body.regular} text-foreground`}>
                    {selected.next}
                  </p>
                </section>
                <section>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                    Deliverables
                  </p>
                  <ul className="space-y-1.5">
                    {selected.deliverables.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        {item.done ? (
                          <Check className="h-4 w-4 mt-0.5 text-[#c2cc06] shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        )}
                        <span className={item.done ? "text-muted-foreground line-through" : ""}>
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                    Email chain
                  </p>
                  <p className={`${textStyles.body.small} text-muted-foreground`}>
                    {selected.emailNote}
                  </p>
                  {selected.emails.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {[...selected.emails]
                        .sort(
                          (a, b) =>
                            new Date(b.receivedAt).getTime() -
                            new Date(a.receivedAt).getTime()
                        )
                        .slice(0, 8)
                        .map((email) => (
                          <li
                            key={email.id}
                            className="rounded-md border border-border bg-background/40 p-2"
                          >
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              {email.direction === "outbound" ? "R/HOOD sent" : "Reply"}
                              {email.fromEmail ? ` · ${email.fromEmail}` : ""}
                            </p>
                            {email.subject ? (
                              <p className="text-xs text-foreground mt-0.5">{email.subject}</p>
                            ) : null}
                            {email.bodyText ? (
                              <p className={`${textStyles.body.small} text-muted-foreground mt-1 line-clamp-3`}>
                                {email.bodyText}
                              </p>
                            ) : null}
                          </li>
                        ))}
                    </ul>
                  ) : null}
                </section>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
