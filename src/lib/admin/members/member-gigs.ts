import { supabase } from "@/integrations/supabase/client";

export type MemberGigRow = {
  id: string;
  name: string | null;
  venue: string | null;
  eventDate: string | null;
  status: string;
  djRating: number | null;
  fromOpportunity: boolean;
};

type UntypedClient = {
  from: (name: string) => any;
  rpc: (name: string, params: Record<string, unknown>) => any;
};

const client = supabase as unknown as UntypedClient;

/** Gig records for one DJ, newest first. */
export async function fetchMemberGigs(
  memberId: string
): Promise<{ ok: true; gigs: MemberGigRow[] } | { ok: false; message: string }> {
  const { data, error } = await client
    .from("gigs")
    .select("id, name, venue, event_date, status, dj_rating, opportunity_id")
    .eq("dj_id", memberId)
    .order("event_date", { ascending: false });

  if (error) {
    return { ok: false, message: error.message || "Couldn't load gigs." };
  }

  const gigs = ((data ?? []) as Array<Record<string, any>>).map((row) => ({
    id: String(row.id),
    name: row.name ?? null,
    venue: row.venue ?? null,
    eventDate: row.event_date ?? null,
    status: String(row.status || "upcoming"),
    djRating: Number(row.dj_rating) > 0 ? Number(row.dj_rating) : null,
    fromOpportunity: Boolean(row.opportunity_id),
  }));

  return { ok: true, gigs };
}

/**
 * Marks a gig done and rates the DJ (1–5). The database recounts the DJ's
 * gigs completed and star rating, which the app and portal both read.
 */
export async function completeGigAndRate(params: {
  gigId: string;
  stars: number;
  comment: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await client.rpc("complete_gig_and_rate", {
    p_gig_id: params.gigId,
    p_stars: params.stars,
    p_comment: params.comment.trim() || null,
  });
  if (error) {
    return { ok: false, message: error.message || "Couldn't complete this gig." };
  }
  return { ok: true };
}
