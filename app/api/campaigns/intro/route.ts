import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { notifyApprovedApplication } from "@/lib/email/notify-approved-application";

type Body = {
  applicationId?: string;
  action?: "send" | "mark";
};

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function fromUntyped(admin: NonNullable<ReturnType<typeof serviceClient>>, table: string) {
  return (admin as unknown as { from: (name: string) => any }).from(table);
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!accessToken) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const admin = serviceClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const {
    data: { user },
    error: authError,
  } = await admin.auth.getUser(accessToken);
  if (authError || !user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { data: profile } = await fromUntyped(admin, "user_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (String(profile?.role || "").toLowerCase() !== "admin") {
    return NextResponse.json({ error: "R/HOOD team only." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Body;
  const applicationId = body.applicationId?.trim();
  if (!applicationId || (body.action !== "send" && body.action !== "mark")) {
    return NextResponse.json(
      { error: "Application id and an action (send or mark) are required." },
      { status: 400 }
    );
  }

  const { data: app } = await fromUntyped(admin, "applications")
    .select("id, opportunity_id, user_id, status")
    .eq("id", applicationId)
    .maybeSingle();
  if (!app) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }
  if (app.status !== "approved") {
    return NextResponse.json(
      { error: "Only approved applications have an intro." },
      { status: 400 }
    );
  }

  if (body.action === "mark") {
    const { error } = await fromUntyped(admin, "campaign_events").upsert(
      {
        application_id: applicationId,
        opportunity_id: app.opportunity_id,
        kind: "intro_email",
        source: "marked",
        created_by: user.id,
      },
      { onConflict: "application_id,kind", ignoreDuplicates: true }
    );
    if (error) {
      return NextResponse.json(
        { error: error.message || "Could not record the intro." },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true, introSent: true });
  }

  const result = await notifyApprovedApplication({
    applicationId,
    opportunityId: app.opportunity_id,
    djUserId: app.user_id,
    introOnly: true,
  });
  if (!result.introSent) {
    return NextResponse.json(
      { error: result.message || "The intro email could not be sent." },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, introSent: true });
}
