import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type Body = {
  userId?: string;
  status?: string;
  source?: string | null;
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

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const accessToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : "";
    if (!accessToken) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
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
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data: profile } = await admin
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Only admins can review DJ applications." }, { status: 403 });
    }

    const body = (await request.json()) as Body;
    const userId = body.userId?.trim();
    const status = body.status;
    const source = body.source?.trim() || "application";
    if (!userId || !status || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "userId and a valid status are required." }, { status: 400 });
    }

    const rpc = await admin.rpc("admin_set_dj_membership" as never, {
      p_user_id: userId,
      p_status: status,
      p_source: source,
    } as never);

    if (!rpc.error) {
      return NextResponse.json({ ok: true });
    }

    const { data: target } = await admin
      .from("user_profiles")
      .select("id, role")
      .eq("id", userId)
      .maybeSingle();
    if (!target || target.role === "brand") {
      return NextResponse.json({ error: "DJ profile not found." }, { status: 404 });
    }

    const payload: Record<string, string> = {
      membership_status: status,
      membership_source: source,
    };
    // Studio defaults new profiles to admin, including DJ app signups.
    if (target.role !== "dj") {
      payload.role = "dj";
    }

    const withReview = {
      ...payload,
      membership_reviewed_at: new Date().toISOString(),
      membership_reviewed_by: user.id,
    };

    let update = await admin.from("user_profiles").update(withReview).eq("id", userId);
    if (update.error && String(update.error.message || "").includes("membership_reviewed")) {
      update = await admin.from("user_profiles").update(payload).eq("id", userId);
    }

    if (update.error) {
      return NextResponse.json(
        { error: update.error.message || rpc.error.message || "Failed to update membership." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[dj-membership]", error);
    return NextResponse.json({ error: "Failed to update membership." }, { status: 500 });
  }
}
