export type PipelineStep =
  | "listed"
  | "applicants"
  | "approved"
  | "intro"
  | "talking"
  | "done";

export const PIPELINE: { id: PipelineStep; label: string }[] = [
  { id: "listed", label: "Listed" },
  { id: "applicants", label: "Applicants" },
  { id: "approved", label: "DJ approved" },
  { id: "intro", label: "Intro sent" },
  { id: "talking", label: "Replies" },
  { id: "done", label: "Gig done" },
];

export type CampaignOwner =
  | "rhood"
  | "brand"
  | "dj"
  | "replies"
  | "applicants"
  | "done";

export const OWNER_LABEL: Record<CampaignOwner, string> = {
  rhood: "R/HOOD to act",
  brand: "Waiting on brand",
  dj: "Waiting on DJ",
  replies: "Waiting on replies",
  applicants: "Waiting on applicants",
  done: "Done",
};

export type ReplySender = "brand" | "dj" | "other";

export type CampaignEmail = {
  id: string;
  applicationId: string | null;
  direction: "inbound" | "outbound";
  fromEmail: string | null;
  sender: ReplySender | "rhood";
  bodyText: string | null;
  subject: string | null;
  receivedAt: string;
};

export type CampaignPlacement = {
  applicationId: string;
  djName: string;
  djEmail: string | null;
  status: "pending" | "approved" | "rejected";
  appliedAt: string | null;
  introAt: string | null;
  introSource: "sent" | "marked" | null;
  gigCompleted: boolean;
  lastReplyFrom: ReplySender | null;
  lastReplyAt: string | null;
};

export type CampaignAssessment = {
  step: PipelineStep;
  completed: PipelineStep[];
  owner: CampaignOwner;
  headline: string;
  next: string;
};

export type CampaignRow = CampaignAssessment & {
  opportunityId: string;
  title: string;
  brandName: string;
  brandEmail: string | null;
  location: string | null;
  eventAt: string | null;
  eventLabel: string | null;
  listingLive: boolean;
  placements: CampaignPlacement[];
  emails: CampaignEmail[];
};

const CHASE_AFTER_HOURS = 48;
const STALE_REVIEW_HOURS = 72;
const EVENT_GRACE_HOURS = 12;

function hoursBetween(fromIso: string | null, now: number): number | null {
  if (!fromIso) return null;
  const then = new Date(fromIso).getTime();
  if (Number.isNaN(then)) return null;
  return (now - then) / 3_600_000;
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function daysLabel(hours: number): string {
  const days = Math.floor(hours / 24);
  return days <= 1 ? "a day" : `${days} days`;
}

export function classifySender(
  fromEmail: string | null,
  brandEmail: string | null,
  djEmail: string | null
): ReplySender | "rhood" {
  const from = (fromEmail || "").toLowerCase();
  if (brandEmail && from === brandEmail.toLowerCase()) return "brand";
  if (djEmail && from === djEmail.toLowerCase()) return "dj";
  if (from.endsWith("@rhood.io")) return "rhood";
  return "other";
}

export function assessCampaign(input: {
  listingLive: boolean;
  eventAt: string | null;
  eventLabel: string | null;
  placements: CampaignPlacement[];
  now?: number;
}): CampaignAssessment {
  const now = input.now ?? Date.now();
  const placements = input.placements;
  const pending = placements.filter((p) => p.status === "pending");
  const approved = placements.filter((p) => p.status === "approved");
  const rejected = placements.filter((p) => p.status === "rejected");
  const introed = approved.filter((p) => p.introAt);
  const missingIntro = approved.filter((p) => !p.introAt);
  const replied = approved.filter((p) => p.lastReplyFrom);
  const gigsDone = approved.length > 0 && approved.every((p) => p.gigCompleted);
  const sinceEvent = hoursBetween(input.eventAt, now);
  const eventPassed = sinceEvent !== null && sinceEvent > EVENT_GRACE_HOURS;

  const reached: Record<PipelineStep, boolean> = {
    listed: input.listingLive || placements.length > 0,
    applicants: placements.length > 0,
    approved: approved.length > 0,
    intro: approved.length > 0 && missingIntro.length === 0,
    talking: replied.length > 0,
    done: gigsDone,
  };
  const completed = PIPELINE.map((s) => s.id).filter((id) => reached[id]);
  const step: PipelineStep = gigsDone
    ? "done"
    : PIPELINE.find((s) => !reached[s.id])?.id ?? "done";

  const approvedNames = joinNames(approved.map((p) => p.djName));

  if (gigsDone) {
    return {
      step,
      completed,
      owner: "done",
      headline: `Gig done with ${approvedNames}.`,
      next: "Nothing outstanding.",
    };
  }

  if (missingIntro.length > 0) {
    return {
      step,
      completed,
      owner: "rhood",
      headline: `Approved ${joinNames(missingIntro.map((p) => p.djName))} — no intro email on record.`,
      next: "Send the intro, or mark it as sent if it went out before tracking started.",
    };
  }

  if (eventPassed && approved.length > 0) {
    return {
      step,
      completed,
      owner: "rhood",
      headline: `The event was ${input.eventLabel ?? "in the past"}. ${approvedNames} ${approved.length === 1 ? "was" : "were"} booked.`,
      next: "Confirm it happened, then mark the gig done on the application.",
    };
  }

  if (eventPassed) {
    return {
      step,
      completed,
      owner: "rhood",
      headline: `The event was ${input.eventLabel ?? "in the past"} and no DJ was approved.`,
      next:
        pending.length > 0
          ? `Reject the ${plural(pending.length, "open application")} and archive the listing.`
          : "Archive the listing.",
    };
  }

  if (introed.length > 0) {
    const latest = [...approved]
      .filter((p) => p.lastReplyAt)
      .sort((a, b) => (b.lastReplyAt ?? "").localeCompare(a.lastReplyAt ?? ""))[0];
    if (latest?.lastReplyFrom === "dj") {
      return {
        step,
        completed,
        owner: "brand",
        headline: `${latest.djName} replied on the intro thread. Waiting on the brand.`,
        next: "Nudge the brand to reply-all and lock in the details.",
      };
    }
    if (latest?.lastReplyFrom === "brand") {
      return {
        step,
        completed,
        owner: "dj",
        headline: `The brand replied on the intro thread. Waiting on ${latest.djName}.`,
        next: `Nudge ${latest.djName} to reply-all with availability.`,
      };
    }
    if (latest) {
      return {
        step,
        completed,
        owner: "replies",
        headline: "Conversation is going on the intro thread.",
        next: "Keep an eye on the thread until the gig is confirmed.",
      };
    }
    const firstIntro = introed
      .map((p) => p.introAt as string)
      .sort()[0];
    const since = hoursBetween(firstIntro, now) ?? 0;
    if (since >= CHASE_AFTER_HOURS) {
      return {
        step,
        completed,
        owner: "rhood",
        headline: `Intro sent ${daysLabel(since)} ago for ${approvedNames}. No replies logged since.`,
        next: "Chase the brand and DJ on the intro thread.",
      };
    }
    return {
      step,
      completed,
      owner: "replies",
      headline: `Intro sent for ${approvedNames}. Waiting for the brand and DJ to reply.`,
      next: `If nobody replies within ${CHASE_AFTER_HOURS} hours, chase them.`,
    };
  }

  if (!input.listingLive && placements.length === 0) {
    return {
      step,
      completed,
      owner: "rhood",
      headline: "The listing isn't live, so DJs can't apply.",
      next: "Publish the listing.",
    };
  }

  if (pending.length > 0) {
    const oldest = pending
      .map((p) => p.appliedAt)
      .filter((v): v is string => Boolean(v))
      .sort()[0];
    const waited = hoursBetween(oldest ?? null, now) ?? 0;
    const stale = waited >= STALE_REVIEW_HOURS;
    return {
      step,
      completed,
      owner: stale ? "rhood" : "brand",
      headline: stale
        ? `${plural(pending.length, "applicant")} waiting — the oldest for ${daysLabel(waited)}.`
        : `${plural(pending.length, "applicant")} waiting for review.`,
      next: stale
        ? "Nudge the brand to review, or approve a DJ from Studio."
        : "The brand reviews applicants and approves a DJ.",
    };
  }

  if (rejected.length > 0) {
    return {
      step,
      completed,
      owner: "applicants",
      headline: `${plural(rejected.length, "applicant")} rejected. Waiting for new applications.`,
      next: "Share the listing with more DJs.",
    };
  }

  return {
    step,
    completed,
    owner: "applicants",
    headline: "Live, but no applications yet.",
    next: "Share the listing with DJs who fit the brief.",
  };
}
