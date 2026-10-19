import { NextResponse } from "next/server";
import {
  ensureMarketingSetup,
  getMarketingStatus,
  refreshDomain,
  requireAdmin,
  syncContacts,
} from "@/lib/email/marketing/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;
  return NextResponse.json(await getMarketingStatus(auth.admin));
}

type Action = "setup" | "check_domain" | "sync" | "sync_full";

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if ("response" in auth) return auth.response;

  const body = (await request.json().catch(() => ({}))) as { action?: Action };
  switch (body.action) {
    case "setup": {
      const result = await ensureMarketingSetup(auth.admin);
      if (!result.ok) return NextResponse.json({ error: result.message }, { status: 502 });
      const sync = await syncContacts(auth.admin);
      return NextResponse.json({ ok: true, sync });
    }
    case "check_domain": {
      const result = await refreshDomain(auth.admin);
      if (!result.ok) return NextResponse.json({ error: result.message }, { status: 502 });
      return NextResponse.json({ ok: true });
    }
    case "sync":
    case "sync_full": {
      const result = await syncContacts(auth.admin, { full: body.action === "sync_full" });
      if (!result.ok) return NextResponse.json({ error: result.message }, { status: 502 });
      return NextResponse.json(result);
    }
    default:
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }
}
