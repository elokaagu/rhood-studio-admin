import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/date-utils";
import type {
  BrandMember,
  BrandProfileRow,
  BrandsAggregateStats,
  BrandsSortOption,
} from "./types";
import { brandsSortToSupabaseOrder } from "./sort";

type OpportunityRow = {
  id: string;
  organizer_id: string;
  title: string | null;
  created_at: string | null;
};

type ApplicationRow = {
  opportunity_id: string;
  status: string | null;
};

function safeFormatDate(value: string | null): string {
  if (!value) return "Unknown";
  const formatted = formatDate(value);
  return formatted === "Invalid Date" ? "Unknown" : formatted;
}

function buildBrandMembers(
  profiles: BrandProfileRow[],
  opportunities: OpportunityRow[],
  applications: ApplicationRow[]
): { members: BrandMember[]; aggregateStats: BrandsAggregateStats } {
  const oppsByBrand = new Map<string, OpportunityRow[]>();
  const oppIdToBrandId = new Map<string, string>();

  for (const o of opportunities) {
    if (!o.organizer_id) continue;
    const list = oppsByBrand.get(o.organizer_id) ?? [];
    list.push(o);
    oppsByBrand.set(o.organizer_id, list);
    oppIdToBrandId.set(o.id, o.organizer_id);
  }

  const appCountsByBrand = new Map<
    string,
    {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    }
  >();

  for (const p of profiles) {
    appCountsByBrand.set(p.id, {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    });
  }

  for (const app of applications) {
    const brandId = oppIdToBrandId.get(app.opportunity_id);
    if (!brandId) continue;
    const bucket = appCountsByBrand.get(brandId);
    if (!bucket) continue;
    bucket.total += 1;
    const s = (app.status || "").toLowerCase();
    if (s === "pending") bucket.pending += 1;
    else if (s === "approved") bucket.approved += 1;
    else if (s === "rejected") bucket.rejected += 1;
  }

  const members: BrandMember[] = profiles.map((member) => {
    const opps = oppsByBrand.get(member.id) ?? [];
    const counts = appCountsByBrand.get(member.id) ?? {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    let recent: OpportunityRow | null = null;
    for (const o of opps) {
      if (!o.created_at) continue;
      if (
        !recent ||
        new Date(o.created_at).getTime() > new Date(recent.created_at!).getTime()
      ) {
        recent = o;
      }
    }

    return {
      id: member.id,
      name: member.brand_name || `${member.first_name} ${member.last_name}`,
      email: member.email,
      location: member.city,
      joinedDate: safeFormatDate(member.created_at),
      lastActive: safeFormatDate(member.updated_at),
      status: "active",
      brandName: member.brand_name,
      bio: member.bio,
      profileImageUrl: member.profile_image_url,
      opportunitiesCount: opps.length,
      totalApplications: counts.total,
      pendingApplications: counts.pending,
      approvedApplications: counts.approved,
      rejectedApplications: counts.rejected,
      recentOpportunity: recent?.title ?? null,
      recentOpportunityDate: recent?.created_at
        ? formatDate(recent.created_at)
        : null,
    };
  });

  const aggregateStats = members.reduce<BrandsAggregateStats>(
    (acc, m) => ({
      totalBrands: acc.totalBrands + 1,
      totalOpportunities: acc.totalOpportunities + m.opportunitiesCount,
      totalApplications: acc.totalApplications + m.totalApplications,
      totalPending: acc.totalPending + m.pendingApplications,
    }),
    {
      totalBrands: 0,
      totalOpportunities: 0,
      totalApplications: 0,
      totalPending: 0,
    }
  );

  return { members, aggregateStats };
}

/**
 * Loads all brand profiles (sorted) plus opportunity/application stats in a
 * small fixed number of queries (no per-brand N+1).
 */
export async function fetchBrandsWithStats(sortBy: BrandsSortOption): Promise<
  | {
      ok: true;
      members: BrandMember[];
      aggregateStats: BrandsAggregateStats;
    }
  | { ok: false; message: string; code?: "table_missing" }
> {
  const sortOrder = brandsSortToSupabaseOrder(sortBy);

  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "id, brand_name, first_name, last_name, email, city, created_at, updated_at, bio, profile_image_url"
    )
    .eq("role", "brand")
    .order(sortOrder.column, { ascending: sortOrder.ascending });

  if (error) {
    if (
      error.message?.includes("relation") &&
      error.message?.includes("does not exist")
    ) {
      return {
        ok: false,
        message: error.message,
        code: "table_missing",
      };
    }
    return { ok: false, message: error.message };
  }

  const profiles = (data || []) as BrandProfileRow[];
  if (profiles.length === 0) {
    return {
      ok: true,
      members: [],
      aggregateStats: {
        totalBrands: 0,
        totalOpportunities: 0,
        totalApplications: 0,
        totalPending: 0,
      },
    };
  }

  const brandIds = profiles.map((p) => p.id);
  const chunk = <T,>(arr: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      out.push(arr.slice(i, i + size));
    }
    return out;
  };

  const opportunities: OpportunityRow[] = [];
  for (const ids of chunk(brandIds, 100)) {
    const { data: oppsData, error: oppsError } = await supabase
      .from("opportunities")
      .select("id, organizer_id, title, created_at")
      .in("organizer_id", ids);

    if (oppsError) {
      return { ok: false, message: oppsError.message };
    }
    opportunities.push(...((oppsData || []) as OpportunityRow[]));
  }

  const opportunityIds = opportunities.map((o) => o.id);

  let applications: ApplicationRow[] = [];
  for (const ids of chunk(opportunityIds, 100)) {
    const { data: appsData, error: appsError } = await supabase
      .from("applications")
      .select("opportunity_id, status")
      .in("opportunity_id", ids);

    if (appsError) {
      return { ok: false, message: appsError.message };
    }
    applications.push(...((appsData || []) as ApplicationRow[]));
  }

  const { members, aggregateStats } = buildBrandMembers(
    profiles,
    opportunities,
    applications
  );

  return { ok: true, members, aggregateStats };
}
