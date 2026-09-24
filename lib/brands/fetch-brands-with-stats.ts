import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/date-utils";
import type {
  BrandMember,
  BrandProfileRow,
  BrandsAggregateStats,
  BrandsSortOption,
} from "./types";
import { brandsSortToSupabaseOrder } from "./sort";

function fromUntyped(table: string) {
  return (supabase as unknown as { from: (name: string) => any }).from(table);
}

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

function accountIdFor(profile: BrandProfileRow): string {
  return profile.brand_account_id?.trim() || profile.id;
}

function displayName(profile: BrandProfileRow): string {
  return (
    profile.brand_name ||
    `${profile.first_name} ${profile.last_name}`.trim() ||
    profile.email
  );
}

function personName(profile: BrandProfileRow): string {
  const name = `${profile.first_name} ${profile.last_name}`.trim();
  return name || profile.email;
}

function buildBrandMembers(
  profiles: BrandProfileRow[],
  opportunities: OpportunityRow[],
  applications: ApplicationRow[]
): { members: BrandMember[]; aggregateStats: BrandsAggregateStats } {
  const profilesById = new Map(profiles.map((p) => [p.id, p]));
  const byAccount = new Map<string, BrandProfileRow[]>();

  for (const profile of profiles) {
    const accountId = accountIdFor(profile);
    const list = byAccount.get(accountId) ?? [];
    list.push(profile);
    byAccount.set(accountId, list);
  }

  const oppsByBrand = new Map<string, OpportunityRow[]>();
  const oppIdToBrandId = new Map<string, string>();

  for (const o of opportunities) {
    if (!o.organizer_id) continue;
    const organizer = profilesById.get(o.organizer_id);
    const accountId = organizer ? accountIdFor(organizer) : o.organizer_id;
    const list = oppsByBrand.get(accountId) ?? [];
    list.push(o);
    oppsByBrand.set(accountId, list);
    oppIdToBrandId.set(o.id, accountId);
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

  for (const accountId of byAccount.keys()) {
    appCountsByBrand.set(accountId, {
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

  const members: BrandMember[] = [];
  for (const [accountId, people] of byAccount) {
    const owner =
      people.find((p) => p.id === accountId) ||
      profilesById.get(accountId) ||
      people[0];
    if (!owner) continue;

    const teammates = people
      .filter((p) => p.id !== owner.id)
      .map((p) => ({
        id: p.id,
        name: personName(p),
        email: p.email,
      }));

    const opps = oppsByBrand.get(accountId) ?? [];
    const counts = appCountsByBrand.get(accountId) ?? {
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

    members.push({
      id: owner.id,
      name: displayName(owner),
      email: owner.email,
      location: owner.city,
      joinedDate: safeFormatDate(owner.created_at),
      lastActive: safeFormatDate(owner.updated_at),
      status: "active",
      brandName: owner.brand_name,
      bio: owner.bio,
      profileImageUrl: owner.profile_image_url,
      opportunitiesCount: opps.length,
      totalApplications: counts.total,
      pendingApplications: counts.pending,
      approvedApplications: counts.approved,
      rejectedApplications: counts.rejected,
      recentOpportunity: recent?.title ?? null,
      recentOpportunityDate: recent?.created_at
        ? formatDate(recent.created_at)
        : null,
      teammates,
    });
  }

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

  const selectWithAccount =
    "id, brand_name, first_name, last_name, email, city, created_at, updated_at, bio, profile_image_url, brand_account_id";
  const selectWithoutAccount =
    "id, brand_name, first_name, last_name, email, city, created_at, updated_at, bio, profile_image_url";

  let { data, error } = await fromUntyped("user_profiles")
    .select(selectWithAccount)
    .eq("role", "brand")
    .order(sortOrder.column, { ascending: sortOrder.ascending });

  if (error && /brand_account_id/i.test(error.message || "")) {
    ({ data, error } = await fromUntyped("user_profiles")
      .select(selectWithoutAccount)
      .eq("role", "brand")
      .order(sortOrder.column, { ascending: sortOrder.ascending }));
  }

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
