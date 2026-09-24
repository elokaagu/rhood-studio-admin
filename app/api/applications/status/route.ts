import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { notifyApprovedApplication } from "@/lib/email/notify-approved-application";

type Body = {
  applicationId?: string;
  applicationType?: string;
  status?: string;
};

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function callerClient(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

type AdminClient = NonNullable<ReturnType<typeof serviceClient>>;

function fromUntyped(admin: AdminClient, table: string) {
  return (admin as unknown as { from: (name: string) => any }).from(table);
}

function mentions(error: { message?: string; details?: string; hint?: string; code?: string } | null, token: string) {
  if (!error) return false;
  const text = [error.message, error.details, error.hint, error.code]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return text.includes(token.toLowerCase());
}

function ownerIdsFrom(row: Record<string, unknown> | null): string[] {
  if (!row) return [];
  return ["organizer_id", "created_by", "posted_by"]
    .map((key) => row[key])
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

async function fetchOpportunity(admin: AdminClient, opportunityId: string) {
  const full = await fromUntyped(admin, "opportunities")
    .select("id, organizer_id, created_by, posted_by, organizer_name, max_approvals")
    .eq("id", opportunityId)
    .maybeSingle();

  if (!full.error) return full;

  const withoutMax = await fromUntyped(admin, "opportunities")
    .select("id, organizer_id, created_by, posted_by, organizer_name")
    .eq("id", opportunityId)
    .maybeSingle();
  if (!withoutMax.error) return withoutMax;

  const core = await fromUntyped(admin, "opportunities")
    .select("id, organizer_id, organizer_name")
    .eq("id", opportunityId)
    .maybeSingle();
  return core;
}

async function countApprovedDjs(
  admin: AdminClient,
  opportunityId: string,
  excludeId: string
): Promise<number> {
  const simpleQuery = fromUntyped(admin, "applications")
    .select("id", { count: "exact", head: true })
    .eq("opportunity_id", opportunityId)
    .eq("status", "approved")
    .neq("id", excludeId);
  const formQuery = fromUntyped(admin, "application_form_responses")
    .select("id", { count: "exact", head: true })
    .eq("opportunity_id", opportunityId)
    .eq("status", "approved")
    .neq("id", excludeId);

  const [simpleResult, formResult] = await Promise.all([simpleQuery, formQuery]);
  const formMissing =
    mentions(formResult.error, "does not exist") || formResult.error?.code === "42P01";
  return (simpleResult.count ?? 0) + (formMissing ? 0 : formResult.count ?? 0);
}

async function withGenreClippedForGigInsert<T>(
  admin: AdminClient,
  opportunityId: string | null | undefined,
  run: () => Promise<T>
): Promise<T> {
  if (!opportunityId) return run();

  const { data } = await fromUntyped(admin, "opportunities")
    .select("genre")
    .eq("id", opportunityId)
    .maybeSingle();
  const genre = typeof data?.genre === "string" ? data.genre : "";
  if (genre.length <= 100) return run();

  const clipped = genre.slice(0, 100);
  const { error: clipError } = await fromUntyped(admin, "opportunities")
    .update({ genre: clipped })
    .eq("id", opportunityId);
  if (clipError) return run();

  try {
    return await run();
  } finally {
    await fromUntyped(admin, "opportunities")
      .update({ genre })
      .eq("id", opportunityId);
  }
}

async function updateApplicationRow(
  admin: AdminClient,
  tableName: string,
  applicationId: string,
  status: string,
  isFormResponse: boolean
) {
  const payload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (isFormResponse) {
    payload.reviewed_at = new Date().toISOString();
  }

  let result = await fromUntyped(admin, tableName)
    .update(payload)
    .eq("id", applicationId);

  if (result.error && mentions(result.error, "updated_at")) {
    delete payload.updated_at;
    result = await fromUntyped(admin, tableName)
      .update(payload)
      .eq("id", applicationId);
  }

  if (result.error && mentions(result.error, "reviewed_at")) {
    delete payload.reviewed_at;
    result = await fromUntyped(admin, tableName)
      .update(payload)
      .eq("id", applicationId);
  }

  if (result.error && (mentions(result.error, "gigs") || mentions(result.error, "row-level security"))) {
    result = await fromUntyped(admin, tableName)
      .update({ status })
      .eq("id", applicationId);
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";
    if (!accessToken) {
      return NextResponse.json({ error: "You must be signed in to manage applications." }, { status: 401 });
    }

    const caller = callerClient(accessToken);
    const admin = serviceClient();
    if (!caller || !admin) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const {
      data: { user },
      error: authError,
    } = await caller.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: "You must be signed in to manage applications." }, { status: 401 });
    }

    const body = (await request.json()) as Body;
    const applicationId = body.applicationId?.trim();
    const status = body.status;
    const applicationType = body.applicationType === "form_response" ? "form_response" : "simple";
    if (!applicationId || (status !== "approved" && status !== "rejected")) {
      return NextResponse.json({ error: "Application id and a valid status are required." }, { status: 400 });
    }

    const tableName =
      applicationType === "form_response" ? "application_form_responses" : "applications";

    const { data: appRow, error: appError } = await fromUntyped(admin, tableName)
      .select("id, opportunity_id, status, user_id")
      .eq("id", applicationId)
      .maybeSingle();

    if (appError && applicationType === "form_response" && mentions(appError, "does not exist")) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }
    if (!appRow) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const { data: profile } = await fromUntyped(admin, "user_profiles")
      .select("id, role, brand_name, first_name, last_name")
      .eq("id", user.id)
      .maybeSingle();

    const role = String(profile?.role || "").toLowerCase();
    const isAdmin =
      role === "admin" || (role === "" && !profile?.brand_name);

    let isOwner = false;
    let maxApprovals: number | null = null;
    if (appRow.opportunity_id) {
      const { data: oppRow, error: oppError } = await fetchOpportunity(
        admin,
        appRow.opportunity_id
      );
      if (oppError) {
        return NextResponse.json(
          { error: oppError.message || "Could not load this opportunity." },
          { status: 400 }
        );
      }
      const opp = (oppRow ?? {}) as Record<string, unknown>;
      isOwner = ownerIdsFrom(opp).includes(user.id);
      if (!isOwner) {
        const organizerName = String(opp.organizer_name || "")
          .trim()
          .toLowerCase();
        const aliases = [
          profile?.brand_name,
          `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
        ]
          .filter((name): name is string => Boolean(name && name.trim()))
          .map((name) => name.trim().toLowerCase());
        isOwner = Boolean(organizerName) && aliases.includes(organizerName);
      }
      const raw = (oppRow as { max_approvals?: number | null } | null)?.max_approvals;
      maxApprovals = typeof raw === "number" && raw >= 1 ? raw : null;
    }

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You can only approve DJs for opportunities you own." },
        { status: 403 }
      );
    }

    if (
      status === "approved" &&
      maxApprovals &&
      appRow.status !== "approved" &&
      appRow.opportunity_id
    ) {
      const approvedCount = await countApprovedDjs(admin, appRow.opportunity_id, applicationId);
      if (approvedCount >= maxApprovals) {
        return NextResponse.json(
          {
            error:
              maxApprovals === 1
                ? "This opportunity already has its one approved DJ."
                : `This opportunity already has ${maxApprovals} approved DJs.`,
          },
          { status: 400 }
        );
      }
    }

    const runUpdate = () =>
      updateApplicationRow(
        admin,
        tableName,
        applicationId,
        status,
        applicationType === "form_response"
      );
    const update =
      status === "approved"
        ? await withGenreClippedForGigInsert(admin, appRow.opportunity_id, runUpdate)
        : await runUpdate();

    if (update.error) {
      return NextResponse.json(
        { error: update.error.message || "Failed to update application." },
        { status: 400 }
      );
    }

    if (status === "approved") {
      try {
        const emails = await notifyApprovedApplication({
          applicationId,
          applicationType,
          opportunityId: appRow.opportunity_id,
          djUserId: appRow.user_id,
        });
        return NextResponse.json({
          ok: true,
          introSent: emails.introSent,
          decisionSent: emails.decisionSent,
        });
      } catch (emailError) {
        console.error("[applications/status] approval emails", emailError);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[applications/status]", error);
    return NextResponse.json({ error: "Failed to update application." }, { status: 500 });
  }
}
