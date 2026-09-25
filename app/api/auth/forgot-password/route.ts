import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { isValidEmail, sanitizeEmail } from "@/lib/email/helpers";
import { buildPasswordResetEmail } from "@/lib/email/password-reset";
import { PORTAL_BASE_URL } from "@/lib/portal-url";

const fromAddress = process.env.RESEND_FROM_EMAIL ?? "R/HOOD <hello@rhood.io>";
const RESEND_COOLDOWN_MS = 60_000;
const recentRequests = new Map<string, number>();

function resetPageOrigin(request: Request): string {
  const origin = new URL(request.url).origin;
  if (/localhost|127\.0\.0\.1|\.vercel\.app$/.test(origin)) return origin;
  return PORTAL_BASE_URL;
}

/**
 * Sends the reset link ourselves (R/HOOD sender + branding) instead of
 * Supabase's default email. The link carries a one-time token hash that
 * /reset-password verifies, so it doesn't depend on Supabase redirect URLs.
 * Always answers ok so the form can't reveal which emails have accounts.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? sanitizeEmail(body.email) : "";
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const last = recentRequests.get(email);
  if (last && Date.now() - last < RESEND_COOLDOWN_MS) {
    return NextResponse.json({ ok: true });
  }
  recentRequests.set(email, Date.now());

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!url || !serviceKey || !resendKey) {
    console.error("[forgot-password] Missing Supabase service role or Resend key.");
    return NextResponse.json({ error: "Password reset is unavailable right now." }, { status: 500 });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    return NextResponse.json({ ok: true });
  }

  const { data: profile } = await admin
    .from("user_profiles")
    .select("first_name")
    .eq("id", data.user.id)
    .maybeSingle();

  const resetUrl = `${resetPageOrigin(request)}/reset-password?token_hash=${encodeURIComponent(
    tokenHash
  )}&type=recovery`;
  const message = buildPasswordResetEmail({
    resetUrl,
    firstName: (profile as { first_name?: string | null } | null)?.first_name,
  });

  const sent = await new Resend(resendKey).emails.send({
    from: fromAddress,
    to: email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
  if (sent.error) {
    console.error("[forgot-password] Resend failed:", sent.error);
    recentRequests.delete(email);
    return NextResponse.json(
      { error: "We couldn't send the reset email. Please try again shortly." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
