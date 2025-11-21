import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/integrations/supabase/server";

/**
 * API endpoint to boost an opportunity
 * Costs 100 credits to boost an opportunity to the top of the list for 24 hours
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
    const { opportunity_id } = body;

    // Validate input
    if (!opportunity_id) {
      return NextResponse.json(
        { error: "Opportunity ID is required" },
        { status: 400 }
      );
    }

    // Check if user is a DJ (not a brand or admin)
    // @ts-ignore - credits column not in types yet (migration needed)
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role, credits")
      .eq("id", user.id)
      .single() as { data: any; error: any };

    if (!profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }

    // Only DJs can boost (exclude brands and admins)
    if (profile.role === "brand" || profile.role === "admin") {
      return NextResponse.json(
        { error: "Only DJs can boost opportunities" },
        { status: 403 }
      );
    }

    // Check if user has enough credits (100 credits required)
    const BOOST_COST = 100;
    if ((profile.credits || 0) < BOOST_COST) {
      return NextResponse.json(
        { 
          error: "Insufficient credits",
          required: BOOST_COST,
          current: profile.credits || 0
        },
        { status: 400 }
      );
    }

    // Check if opportunity exists and is active
    const { data: opportunity, error: oppError } = await supabase
      .from("opportunities")
      .select("id, is_active")
      .eq("id", opportunity_id)
      .single();

    if (oppError || !opportunity) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    if (!opportunity.is_active) {
      return NextResponse.json(
        { error: "Cannot boost inactive opportunity" },
        { status: 400 }
      );
    }

    // Check if user already has an active boost for this opportunity
    // @ts-ignore - opportunity_boosts table not in types yet (migration needed)
    const { data: existingBoost } = await (supabase.from as any)("opportunity_boosts")
      .select("id")
      .eq("opportunity_id", opportunity_id)
      .eq("user_id", user.id)
      .eq("is_active", true)
      .gte("boost_expires_at", new Date().toISOString())
      .single();

    if (existingBoost) {
      return NextResponse.json(
        { error: "You already have an active boost for this opportunity" },
        { status: 400 }
      );
    }

    // Calculate boost expiration (24 hours from now)
    const boostExpiresAt = new Date();
    boostExpiresAt.setHours(boostExpiresAt.getHours() + 24);

    // Spend credits
    // @ts-ignore - RPC function not in types yet (migration needed)
    const { data: spendResult, error: spendError } = await (supabase.rpc as any)("spend_credits", {
      p_user_id: user.id,
      p_amount: BOOST_COST,
      p_transaction_type: "boost_used",
      p_description: `Boosted opportunity: ${opportunity_id}`,
      p_reference_id: opportunity_id,
      p_reference_type: "opportunity",
    });

    if (spendError || !spendResult) {
      console.error("Error spending credits:", spendError);
      return NextResponse.json(
        { error: "Failed to spend credits" },
        { status: 500 }
      );
    }

    // Create boost record
    // @ts-ignore - opportunity_boosts table not in types yet (migration needed)
    const { data: boost, error: boostError } = await (supabase.from as any)("opportunity_boosts")
      .insert({
        opportunity_id,
        user_id: user.id,
        boost_cost: BOOST_COST,
        boost_expires_at: boostExpiresAt.toISOString(),
        is_active: true,
      })
      .select()
      .single();

    if (boostError) {
      console.error("Error creating boost:", boostError);
      // Try to refund credits if boost creation failed
      // @ts-ignore - RPC function not in types yet (migration needed)
      await (supabase.rpc as any)("award_credits", {
        p_user_id: user.id,
        p_amount: BOOST_COST,
        p_transaction_type: "manual_adjustment",
        p_description: "Refund: Boost creation failed",
      });
      return NextResponse.json(
        { error: "Failed to create boost" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      boost: {
        id: boost.id,
        expires_at: boost.boost_expires_at,
      },
      message: `Successfully boosted opportunity! Boost expires in 24 hours.`,
    });
  } catch (error) {
    console.error("Error in boost-opportunity:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

