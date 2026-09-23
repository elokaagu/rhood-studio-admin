export type CampaignStage =
  | "live"
  | "reviewing"
  | "intro_sent"
  | "awaiting_brand"
  | "awaiting_dj"
  | "in_conversation"
  | "stalled"
  | "completed";

export type CampaignEmail = {
  id: string;
  direction: "inbound" | "outbound";
  fromEmail: string | null;
  bodyText: string | null;
  subject: string | null;
  receivedAt: string;
};

export type CampaignPlacement = {
  applicationId: string;
  djName: string;
  djEmail: string | null;
  status: string;
  introSent: boolean;
  gigCompleted: boolean;
  lastEmailFrom: "rhood" | "brand" | "dj" | "other" | null;
  lastEmailAt: string | null;
  hoursSinceActivity: number | null;
};

export type CampaignRow = {
  opportunityId: string;
  title: string;
  brandName: string;
  location: string | null;
  eventLabel: string | null;
  pending: number;
  approved: number;
  rejected: number;
  stage: CampaignStage;
  briefing: string;
  lastActivityAt: string | null;
  placements: CampaignPlacement[];
  emails: CampaignEmail[];
};

const STALL_HOURS = 48;

export function hoursSince(iso: string | null): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return (Date.now() - then) / (1000 * 60 * 60);
}

export type TrafficLight = "green" | "yellow" | "red";

export function trafficLightForStage(stage: CampaignStage): TrafficLight {
  if (stage === "completed" || stage === "in_conversation") return "green";
  if (stage === "stalled") return "red";
  return "yellow";
}

export function stageLabel(stage: CampaignStage): string {
  switch (stage) {
    case "live":
      return "Live";
    case "reviewing":
      return "Reviewing";
    case "intro_sent":
      return "Intro sent";
    case "awaiting_brand":
      return "Waiting on brand";
    case "awaiting_dj":
      return "Waiting on DJ";
    case "in_conversation":
      return "In conversation";
    case "stalled":
      return "Stalled";
    case "completed":
      return "Completed";
  }
}

export type CampaignDeliverable = {
  id: string;
  label: string;
  done: boolean;
};

export function campaignDeliverables(row: {
  pending: number;
  approved: number;
  rejected: number;
  placements: CampaignPlacement[];
  emails: CampaignEmail[];
  listingActive?: boolean;
}): CampaignDeliverable[] {
  const introed = row.placements.some((p) => p.introSent);
  const brandReplied = row.placements.some((p) => p.lastEmailFrom === "brand");
  const djReplied = row.placements.some((p) => p.lastEmailFrom === "dj");
  const inboundChain = row.emails
    .filter((e) => e.direction === "inbound")
    .map((e) => `${e.subject || ""} ${e.bodyText || ""}`)
    .join(" ")
    .toLowerCase();
  const logisticsTalked =
    /confirm|load-?in|set time|call time|deliverable|date locked|see you/i.test(inboundChain);
  const invoiceTalked = /invoice|operation fee|vat/.test(inboundChain);
  const payoutTalked = /paid the dj|payout sent|dj payout/.test(inboundChain);
  return [
    { id: "live", label: "Listing is live", done: row.listingActive !== false },
    {
      id: "apps",
      label: "Applications in",
      done: row.pending + row.approved + row.rejected > 0,
    },
    { id: "approved", label: "DJ approved", done: row.approved > 0 },
    { id: "intro", label: "Intro sent — R/HOOD copied", done: introed },
    { id: "brand_reply", label: "Brand replied on the thread", done: brandReplied },
    { id: "dj_reply", label: "DJ replied on the thread", done: djReplied },
    { id: "logistics", label: "Dates / deliverables confirmed", done: logisticsTalked },
    {
      id: "invoice",
      label: "Invoice issued (DJ budget + 15% + VAT)",
      done: invoiceTalked,
    },
    {
      id: "payout",
      label: "DJ paid",
      done: payoutTalked,
    },
    {
      id: "done",
      label: "Gig marked complete",
      done: row.placements.some((p) => p.gigCompleted),
    },
  ];
}

export function nextStepFromDeliverables(items: CampaignDeliverable[]): string {
  const next = items.find((item) => !item.done);
  if (!next) return "Nothing outstanding — this campaign is complete.";
  switch (next.id) {
    case "live":
      return "Publish the listing so DJs can apply.";
    case "apps":
      return "Wait for applications, or nudge the brand to share the listing.";
    case "approved":
      return "Review applicants and approve a DJ.";
    case "intro":
      return "Approve sends the intro from hello@rhood.io — R/HOOD stays on the thread.";
    case "brand_reply":
      return "Chase the brand to reply-all on the intro thread.";
    case "dj_reply":
      return "Chase the DJ to reply-all with availability and logistics.";
    case "logistics":
      return "Confirm date, load-in, fee, and deliverables on the thread.";
    case "invoice":
      return "When both sides confirm, invoice the brand: DJ budget + 15% operation fee + VAT.";
    case "payout":
      return "After the invoice is paid, send the DJ their fee.";
    case "done":
      return "After the event, mark the gig as done.";
    default:
      return next.label;
  }
}

export function statusUpdateCopy(input: {
  briefing: string;
  next: string;
  emails: CampaignEmail[];
}): { where: string; next: string; emailNote: string } {
  const inbound = input.emails.filter((e) => e.direction === "inbound");
  const latest = [...input.emails].sort(
    (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  )[0];
  let emailNote = "No replies on the copied thread yet — update is from Studio steps only.";
  if (inbound.length > 0 && latest) {
    const snippet = (latest.bodyText || latest.subject || "").replace(/\s+/g, " ").trim();
    emailNote = `Latest on the chain (${inbound.length} repl${inbound.length === 1 ? "y" : "ies"}): ${snippet.slice(0, 240)}${snippet.length > 240 ? "…" : ""}`;
  }
  return { where: input.briefing, next: input.next, emailNote };
}

export function classifySender(
  fromEmail: string | null,
  brandEmail: string | null,
  djEmail: string | null
): CampaignPlacement["lastEmailFrom"] {
  const from = (fromEmail || "").toLowerCase();
  if (!from) return null;
  if (brandEmail && from === brandEmail.toLowerCase()) return "brand";
  if (djEmail && from === djEmail.toLowerCase()) return "dj";
  if (from.includes("rhood.io") || from.includes("rhood")) return "rhood";
  return "other";
}

export function stageAndBriefing(input: {
  pending: number;
  approved: number;
  rejected: number;
  placements: CampaignPlacement[];
  hasInbound: boolean;
}): { stage: CampaignStage; briefing: string } {
  const done = input.placements.filter((p) => p.gigCompleted);
  if (done.length > 0 && done.length === input.approved && input.approved > 0) {
    return {
      stage: "completed",
      briefing: `Gig marked done for ${done.map((p) => p.djName).join(", ")}.`,
    };
  }

  const introed = input.placements.filter((p) => p.introSent);
  if (introed.length > 0) {
    const stalled = introed.filter(
      (p) =>
        (p.hoursSinceActivity ?? 0) >= STALL_HOURS &&
        (p.lastEmailFrom === "rhood" || !p.lastEmailFrom)
    );
    if (stalled.length > 0 && !input.hasInbound) {
      return {
        stage: "stalled",
        briefing: `${input.pending + input.approved + input.rejected} applicant${input.pending + input.approved + input.rejected === 1 ? "" : "s"}. Intro sent to ${stalled.map((p) => p.djName).join(", ")} — no reply on the hello@rhood.io thread in ${STALL_HOURS} hours.`,
      };
    }

    const waitingBrand = introed.filter((p) => p.lastEmailFrom === "dj");
    if (waitingBrand.length > 0) {
      return {
        stage: "awaiting_brand",
        briefing: `${waitingBrand[0].djName} replied. Waiting on the brand.`,
      };
    }
    const waitingDj = introed.filter((p) => p.lastEmailFrom === "brand");
    if (waitingDj.length > 0) {
      return {
        stage: "awaiting_dj",
        briefing: `Brand replied. Waiting on ${waitingDj[0].djName}.`,
      };
    }
    if (input.hasInbound) {
      return {
        stage: "in_conversation",
        briefing: `Intro is live with ${introed.map((p) => p.djName).join(", ")}. Both sides are on the thread.`,
      };
    }
    return {
      stage: "intro_sent",
      briefing: `${input.pending + input.approved + input.rejected} applicant${input.pending + input.approved + input.rejected === 1 ? "" : "s"}. Approved ${introed.map((p) => p.djName).join(", ")}. Intro sent from hello@rhood.io. Waiting for the first reply on the thread.`,
    };
  }

  if (input.pending > 0) {
    return {
      stage: "reviewing",
      briefing: `${input.pending} application${input.pending === 1 ? "" : "s"} waiting to be reviewed.`,
    };
  }

  return {
    stage: "live",
    briefing: "Listing is live. No applications yet.",
  };
}
