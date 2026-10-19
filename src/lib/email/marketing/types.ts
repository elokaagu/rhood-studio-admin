import type { SegmentKey } from "@/lib/email/marketing/config";

export type DomainRecordView = {
  record: string;
  type: string;
  name: string;
  value: string;
  priority?: number;
  status: string;
};

export type DomainSetting = {
  id: string;
  name: string;
  status: string;
  openTracking: boolean;
  clickTracking: boolean;
  trackingSubdomain: string | null;
  records: DomainRecordView[];
  checkedAt: string;
};

export type EventCounts = {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
};

export type BroadcastSummary = {
  id: string;
  name: string;
  status: string;
  sentAt: string | null;
  scheduledAt: string | null;
  /** Unique recipients per event type. */
  counts: EventCounts;
  unsubscribed: number | null;
};

export type MarketingStatus = {
  configured: { resendKey: boolean; cronSecret: boolean };
  setupAt: string | null;
  domain: DomainSetting | null;
  webhook: { connected: boolean; endpoint: string | null };
  contacts: {
    synced: number;
    failed: number;
    bySegment: Record<SegmentKey, number>;
    lastSync: { at: string; created: number; updated: number; unchanged: number; failed: number } | null;
  };
  last30Days: { marketing: EventCounts; product: EventCounts };
  broadcasts: BroadcastSummary[];
  topLinks: { broadcastName: string; links: { url: string; clicks: number; uniqueClicks: number }[] } | null;
  errors: string[];
};
