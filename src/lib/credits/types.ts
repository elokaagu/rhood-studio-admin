export type CreditFilterType =
  | "all"
  | "earned"
  | "spent"
  | "gig_completed"
  | "rating_received"
  | "boost_used";

export type CreditTransactionProfile = {
  id: string;
  dj_name: string | null;
  brand_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
};

export type CreditTransaction = {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
  user_profile: CreditTransactionProfile | null;
};

export type CreditLedgerSummary = {
  loadedEarned: number;
  loadedSpent: number;
  loadedNet: number;
};

export type CreditLedgerPage = {
  rows: CreditTransaction[];
  summary: CreditLedgerSummary;
  page: number;
  pageSize: number;
  hasMore: boolean;
};
