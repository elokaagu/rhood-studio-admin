import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const SIGNUP_WINDOW_MS = 30 * 60 * 1000;

type Body = {
  userId?: string;
  code?: string;
};

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }
  const admin = createClient(url, key, { auth: { persistSession: false } });

  const body = (await request.json().catch(() => ({}))) as Body;
  const userId = body.userId?.trim();
  const code = body.code?.trim().toUpperCase();
  if (!userId || !code) {
    return NextResponse.json({ error: "User and invite code are required." }, { status: 400 });
  }

  // Signup may not have a session yet (email confirmation), so trust only a
  // freshly created auth user rather than the caller's token.
  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(userId);
  const createdAt = authUser?.user?.created_at
    ? new Date(authUser.user.created_at).getTime()
    : 0;
  if (authError || !authUser?.user || Date.now() - createdAt > SIGNUP_WINDOW_MS) {
    return NextResponse.json({ error: "Invite can't be redeemed for this account." }, { status: 403 });
  }

  const inviteCodes = () =>
    (admin as unknown as { from: (name: string) => any }).from("invite_codes");

  const { data: alreadyUsed } = await inviteCodes()
    .select("id")
    .eq("used_by", userId)
    .limit(1)
    .maybeSingle();
  if (alreadyUsed) {
    return NextResponse.json({ ok: true, already: true });
  }

  const { data, error } = await inviteCodes()
    .update({ used_by: userId, used_at: new Date().toISOString() })
    .eq("code", code)
    .eq("is_active", true)
    .is("used_by", null)
    .neq("invite_type", "dj")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[redeem-brand-invite]", error.message);
    return NextResponse.json({ error: "Could not redeem the invite code." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "The invite code is invalid, expired, or already used." },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true });
}
