import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type Body = {
  bookingRequestId?: string;
};

type ProfileRow = {
  role?: string | null;
  brand_name?: string | null;
  brand_account_id?: string | null;
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

    const body = (await request.json()) as Body;
    const bookingRequestId = body.bookingRequestId?.trim();
    if (!bookingRequestId) {
      return NextResponse.json({ error: "Missing booking request id." }, { status: 400 });
    }

    const { data: profileWithAccount, error: profileError } = await admin
      .from("user_profiles")
      .select("role, brand_name, brand_account_id")
      .eq("id", user.id)
      .maybeSingle();

    let profile: ProfileRow | null = profileWithAccount;
    if (profileError && /brand_account_id/i.test(profileError.message || "")) {
      const fallback = await admin
        .from("user_profiles")
        .select("role, brand_name")
        .eq("id", user.id)
        .maybeSingle();
      profile = fallback.data;
    } else if (profileError) {
      profile = null;
    }

    const { data: row, error: rowError } = await admin
      .from("booking_requests")
      .select("id, brand_id, dj_id")
      .eq("id", bookingRequestId)
      .maybeSingle();

    if (rowError || !row) {
      return NextResponse.json({ error: "Booking request not found." }, { status: 404 });
    }

    const role = typeof profile?.role === "string" ? profile.role : null;
    const brandName =
      typeof profile?.brand_name === "string" ? profile.brand_name.trim() : "";
    const isAdmin = role === "admin" || (!role && !brandName);
    const brandAccount =
      (typeof profile?.brand_account_id === "string" && profile.brand_account_id) ||
      user.id;
    const isOwner =
      row.brand_id === user.id ||
      row.brand_id === brandAccount ||
      row.dj_id === user.id;
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "You cannot delete this booking request." },
        { status: 403 }
      );
    }

    const { error: deleteError } = await admin
      .from("booking_requests")
      .delete()
      .eq("id", bookingRequestId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete booking request." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[delete-booking-request]", error);
    return NextResponse.json({ error: "Failed to delete booking request." }, { status: 500 });
  }
}
