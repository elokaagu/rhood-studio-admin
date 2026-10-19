import { NextResponse } from "next/server";
import {
  getSetting,
  refreshDomain,
  serviceClient,
  syncContacts,
} from "@/lib/email/marketing/server";
import type { DomainSetting } from "@/lib/email/marketing/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Daily Vercel cron: keeps Resend contacts in step with Studio users. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const admin = serviceClient();
  if (!admin) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const domain = await getSetting<DomainSetting>(admin, "domain");
  if (domain && domain.status !== "verified") await refreshDomain(admin);

  const result = await syncContacts(admin);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 502 });
  return NextResponse.json(result);
}
