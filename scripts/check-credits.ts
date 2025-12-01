/**
 * Script to check who has credits in the credits system
 * Run with: npx tsx scripts/check-credits.ts
 * 
 * Make sure to set environment variables:
 * NEXT_PUBLIC_SUPABASE_URL=your-url
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
 */

import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local if available
// In Next.js projects, environment variables should be in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder")) {
  console.error("❌ Missing environment variables!");
  console.error("Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set");
  console.error("You can either:");
  console.error("  1. Set them as environment variables: export NEXT_PUBLIC_SUPABASE_URL=...");
  console.error("  2. Create a .env.local file with the variables");
  console.error("  3. Run: NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... npx tsx scripts/check-credits.ts");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface UserWithCredits {
  id: string;
  dj_name: string | null;
  brand_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  credits: number;
  role: string | null;
}

async function getUsersWithCredits() {
  console.log("🔍 Querying users with credits...\n");

  try {
    // Query users with credits > 0, excluding admins
    let query: any = supabase
      .from("user_profiles")
      .select("id, dj_name, brand_name, first_name, last_name, email, credits, role")
      .or("role.is.null,role.neq.admin")
      .order("credits", { ascending: false, nullsLast: true });

    const { data: profiles, error } = await query;

    if (error) {
      console.error("❌ Error querying database:", error);
      return;
    }

    // Filter to only users with credits > 0
    const usersWithCredits = (profiles || []).filter((profile: any) => {
      const credits = profile.credits ?? 0;
      return credits > 0;
    }) as UserWithCredits[];

    if (usersWithCredits.length === 0) {
      console.log("📭 No users have credits at the moment.");
      return;
    }

    // Calculate statistics
    const totalCredits = usersWithCredits.reduce((sum, user) => sum + (user.credits || 0), 0);
    const avgCredits = totalCredits / usersWithCredits.length;
    const maxCredits = Math.max(...usersWithCredits.map(u => u.credits || 0));
    const minCredits = Math.min(...usersWithCredits.map(u => u.credits || 0));

    // Display results
    console.log("=" .repeat(80));
    console.log("📊 CREDITS SUMMARY");
    console.log("=" .repeat(80));
    console.log(`Total users with credits: ${usersWithCredits.length}`);
    console.log(`Total credits in system: ${totalCredits.toLocaleString()}`);
    console.log(`Average credits per user: ${avgCredits.toFixed(2)}`);
    console.log(`Highest credits: ${maxCredits.toLocaleString()}`);
    console.log(`Lowest credits (non-zero): ${minCredits.toLocaleString()}`);
    console.log("=" .repeat(80));
    console.log("\n");

    console.log("=" .repeat(80));
    console.log("👥 USERS WITH CREDITS (Ranked by Credits)");
    console.log("=" .repeat(80));

    usersWithCredits.forEach((user, index) => {
      const rank = index + 1;
      const displayName = 
        user.dj_name || 
        user.brand_name || 
        `${user.first_name || ""} ${user.last_name || ""}`.trim() || 
        user.email;

      const credits = user.credits || 0;
      
      // Format rank
      const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;
      
      console.log(`${rankEmoji} ${displayName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Credits: ${credits.toLocaleString()}`);
      console.log(`   Role: ${user.role || "N/A"}`);
      console.log("");
    });

    console.log("=" .repeat(80));

  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
    if (error.code === '42703' || error.message?.includes('column "credits" does not exist')) {
      console.error("\n⚠️  The credits column doesn't exist yet!");
      console.error("   Please run the credits system migration in Supabase:");
      console.error("   supabase/migrations/20250114000000_create_credits_system.sql");
    }
  }
}

// Run the script
getUsersWithCredits()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

