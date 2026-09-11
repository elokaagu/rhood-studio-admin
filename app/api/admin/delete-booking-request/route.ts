import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type Body = {
  bookingRequestId?: string;
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

    const { data: profile } = await admin
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const { data: row, error: rowError } = await admin
      .from("booking_requests")
      .select("id, brand_id, dj_id")
      .eq("id", bookingRequestId)
      .maybeSingle();

    if (rowError || !row) {
      return NextResponse.json({ error: "Booking request not found." }, { status: 404 });
    }

    const isAdmin = profile?.role === "admin";
    const isOwner = row.brand_id === user.id || row.dj_id === user.id;
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
