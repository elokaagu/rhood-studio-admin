import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { defaultQrDestinationUrl, QR_COOKIE, QR_COOKIE_MAX_AGE_SECONDS } from "@/lib/qr/constants";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function fromUntyped(admin: NonNullable<ReturnType<typeof serviceClient>>, table: string) {
  return (admin as unknown as { from: (name: string) => any }).from(table);
}

function visitorHash(request: Request): string {
  const ua = request.headers.get("user-agent") || "";
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "";
  return createHash("sha256").update(`${ip}|${ua}`).digest("hex").slice(0, 32);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code: raw } = await context.params;
  const code = decodeURIComponent(raw || "").trim().toUpperCase();
  const fallback = defaultQrDestinationUrl();

  if (!code) {
    return NextResponse.redirect(fallback, 302);
  }

  const admin = serviceClient();
  let destination = fallback;
  let qrId: string | null = null;

  if (admin) {
    const { data } = await fromUntyped(admin, "qr_codes")
      .select("id, destination_url, is_active")
      .eq("code", code)
      .maybeSingle();
    if (data?.is_active && data.destination_url) {
      destination = data.destination_url;
      qrId = data.id;
    }
    if (qrId) {
      await fromUntyped(admin, "qr_scans").insert({
        qr_code_id: qrId,
        user_agent: request.headers.get("user-agent")?.slice(0, 500) || null,
        visitor_hash: visitorHash(request),
      });
    }
  }

  const response = NextResponse.redirect(destination, 302);
  response.cookies.set(QR_COOKIE, code, {
    path: "/",
    maxAge: QR_COOKIE_MAX_AGE_SECONDS,
    sameSite: "lax",
    httpOnly: false,
  });
  return response;
}
