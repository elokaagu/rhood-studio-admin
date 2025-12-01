/**
 * Script to check all users in the system (including those with 0 credits)
 * Run with: npx tsx scripts/check-all-users.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder")) {
  console.error("❌ Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface UserProfile {
  id: string;
  dj_name: string | null;
  brand_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  credits: number | null;
  role: string | null;
}

async function getAllUsers() {
  console.log("🔍 Querying all users...\n");

  try {
    let query: any = supabase
      .from("user_profiles")
      .select("id, dj_name, brand_name, first_name, last_name, email, credits, role")
      .order("credits", { ascending: false, nullsLast: true });

    const { data: profiles, error } = await query;

    if (error) {
      console.error("❌ Error querying database:", error);
      if (error.code === '42703' || error.message?.includes('column "credits" does not exist')) {
        console.error("\n⚠️  The credits column doesn't exist yet!");
        console.error("   Please run the credits system migration in Supabase.");
      }
      return;
    }

    const users = (profiles || []) as UserProfile[];

    if (users.length === 0) {
      console.log("📭 No users found in the system.");
      return;
    }

    const usersWithCredits = users.filter(u => (u.credits ?? 0) > 0);
    const usersWithZeroCredits = users.filter(u => (u.credits ?? 0) === 0);
    const usersWithNullCredits = users.filter(u => u.credits === null);

    console.log("=" .repeat(80));
    console.log("📊 USER SUMMARY");
    console.log("=" .repeat(80));
    console.log(`Total users: ${users.length}`);
    console.log(`Users with credits > 0: ${usersWithCredits.length}`);
    console.log(`Users with 0 credits: ${usersWithZeroCredits.length}`);
    console.log(`Users with NULL credits: ${usersWithNullCredits.length}`);
    console.log("=" .repeat(80));
    console.log("\n");

    if (usersWithCredits.length > 0) {
      console.log("=" .repeat(80));
      console.log("👥 USERS WITH CREDITS");
      console.log("=" .repeat(80));
      
      usersWithCredits.forEach((user, index) => {
        const rank = index + 1;
        const displayName = 
          user.dj_name || 
          user.brand_name || 
          `${user.first_name || ""} ${user.last_name || ""}`.trim() || 
          user.email;

        const credits = user.credits || 0;
        const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;
        
        console.log(`${rankEmoji} ${displayName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Credits: ${credits.toLocaleString()}`);
        console.log(`   Role: ${user.role || "N/A"}`);
        console.log("");
      });
    }

    if (usersWithZeroCredits.length > 0) {
      console.log("=" .repeat(80));
      console.log(`👤 USERS WITH 0 CREDITS (${usersWithZeroCredits.length})`);
      console.log("=" .repeat(80));
      
      usersWithZeroCredits.slice(0, 10).forEach((user) => {
        const displayName = 
          user.dj_name || 
          user.brand_name || 
          `${user.first_name || ""} ${user.last_name || ""}`.trim() || 
          user.email;
        console.log(`  - ${displayName} (${user.email})`);
      });
      
      if (usersWithZeroCredits.length > 10) {
        console.log(`  ... and ${usersWithZeroCredits.length - 10} more`);
      }
      console.log("");
    }

    if (usersWithNullCredits.length > 0) {
      console.log("=" .repeat(80));
      console.log(`⚠️  USERS WITH NULL CREDITS (${usersWithNullCredits.length})`);
      console.log("=" .repeat(80));
      console.log("These users may need credits to be initialized:");
      
      usersWithNullCredits.slice(0, 10).forEach((user) => {
        const displayName = 
          user.dj_name || 
          user.brand_name || 
          `${user.first_name || ""} ${user.last_name || ""}`.trim() || 
          user.email;
        console.log(`  - ${displayName} (${user.email})`);
      });
      
      if (usersWithNullCredits.length > 10) {
        console.log(`  ... and ${usersWithNullCredits.length - 10} more`);
      }
      console.log("");
      console.log("💡 You may want to run: POPULATE_ALL_CREDITS.sql or POPULATE_INITIAL_CREDITS.sql");
    }

    console.log("=" .repeat(80));

  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
  }
}

getAllUsers()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

