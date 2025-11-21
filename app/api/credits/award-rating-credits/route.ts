import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/integrations/supabase/server";

/**
 * API endpoint to award credits for ratings
 * Awards +25 credits when a DJ receives a 4-5 star rating
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { dj_id, rating, reference_id, reference_type } = body;

    // Validate input
    if (!dj_id || !rating || rating < 4) {
      return NextResponse.json(
        { error: "Invalid request. Rating must be 4 or 5 stars." },
        { status: 400 }
      );
    }

    // Check if user is a brand/admin who can give ratings
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "brand" && profile.role !== "admin")) {
      return NextResponse.json(
        { error: "Only brands and admins can award rating credits." },
        { status: 403 }
      );
    }

    // Check if credits have already been awarded for this rating
    if (reference_id && reference_type) {
      // @ts-ignore - credit_transactions table not in types yet (migration needed)
      const { data: existing } = await (supabase.from as any)("credit_transactions")
        .select("id")
        .eq("user_id", dj_id)
        .eq("transaction_type", "rating_received")
        .eq("reference_id", reference_id)
        .eq("reference_type", reference_type)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "Credits have already been awarded for this rating." },
          { status: 400 }
        );
      }
    }

    // Award credits using the database function
    // @ts-ignore - RPC function not in types yet (migration needed)
    const { data, error } = await (supabase.rpc as any)("award_credits", {
      p_user_id: dj_id,
      p_amount: 25,
      p_transaction_type: "rating_received",
      p_description: `Received ${rating}-star rating`,
      p_reference_id: reference_id || null,
      p_reference_type: reference_type || null,
    });

    if (error) {
      console.error("Error awarding credits:", error);
      return NextResponse.json(
        { error: "Failed to award credits" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction_id: data,
      message: "Awarded 25 credits for rating",
    });
  } catch (error) {
    console.error("Error in award-rating-credits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

