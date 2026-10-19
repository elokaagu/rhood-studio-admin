import { supabase } from "@/integrations/supabase/client";
import type { MarketingStatus } from "@/lib/email/marketing/types";

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("You must be signed in.");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function readError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error || `Request failed (${response.status}).`;
}

export async function fetchMarketingStatus(): Promise<MarketingStatus> {
  const response = await fetch("/api/admin/email", { headers: await authHeaders() });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as MarketingStatus;
}

export type MarketingAction = "setup" | "check_domain" | "sync" | "sync_full";

export async function runMarketingAction(action: MarketingAction): Promise<Record<string, unknown>> {
  const response = await fetch("/api/admin/email", {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ action }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return (await response.json()) as Record<string, unknown>;
}
