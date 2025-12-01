/**
 * Script to check if anyone has spent credits in the app
 * Run with: npx tsx scripts/check-spent-credits.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder")) {
  console.error("❌ Missing environment variables!");
  console.error("Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SpentTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

interface UserWithSpentCredits {
  user_id: string;
  display_name: string;
  email: string;
  total_spent: number;
  transaction_count: number;
  transactions: SpentTransaction[];
}

async function checkSpentCredits() {
  console.log("🔍 Checking if anyone has spent credits...\n");

  try {
    // Query for all transactions with negative amounts (spent credits)
    // @ts-ignore - credit_transactions table may not be in types yet
    const { data: spentTransactions, error } = await (supabase as any)
      .from("credit_transactions")
      .select("*")
      .lt("amount", 0)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.error("❌ The credit_transactions table doesn't exist yet!");
        console.error("   Please run the credits system migration in Supabase.");
        return;
      }
      throw error;
    }

    if (!spentTransactions || spentTransactions.length === 0) {
      console.log("=" .repeat(80));
      console.log("📊 SPENT CREDITS SUMMARY");
      console.log("=" .repeat(80));
      console.log("✅ No one has spent any credits yet!");
      console.log("=" .repeat(80));
      return;
    }

    // Group transactions by user
    const userSpendingMap: Record<string, UserWithSpentCredits> = {};

    for (const transaction of spentTransactions as SpentTransaction[]) {
      if (!userSpendingMap[transaction.user_id]) {
        userSpendingMap[transaction.user_id] = {
          user_id: transaction.user_id,
          display_name: "",
          email: "",
          total_spent: 0,
          transaction_count: 0,
          transactions: [],
        };
      }

      userSpendingMap[transaction.user_id].total_spent += Math.abs(transaction.amount);
      userSpendingMap[transaction.user_id].transaction_count++;
      userSpendingMap[transaction.user_id].transactions.push(transaction);
    }

    // Fetch user profiles to get names
    const userIds = Object.keys(userSpendingMap);
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, dj_name, brand_name, first_name, last_name, email")
      .in("id", userIds);

    if (profiles) {
      profiles.forEach((profile: any) => {
        if (userSpendingMap[profile.id]) {
          userSpendingMap[profile.id].display_name =
            profile.dj_name ||
            profile.brand_name ||
            `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
            profile.email;
          userSpendingMap[profile.id].email = profile.email;
        }
      });
    }

    const usersWithSpending = Object.values(userSpendingMap);
    const totalSpent = usersWithSpending.reduce((sum, user) => sum + user.total_spent, 0);

    // Display results
    console.log("=" .repeat(80));
    console.log("📊 SPENT CREDITS SUMMARY");
    console.log("=" .repeat(80));
    console.log(`Total users who have spent credits: ${usersWithSpending.length}`);
    console.log(`Total credits spent: ${totalSpent.toLocaleString()}`);
    console.log(`Total transactions: ${spentTransactions.length}`);
    console.log("=" .repeat(80));
    console.log("\n");

    console.log("=" .repeat(80));
    console.log("👥 USERS WHO HAVE SPENT CREDITS");
    console.log("=" .repeat(80));

    // Sort by total spent (descending)
    usersWithSpending.sort((a, b) => b.total_spent - a.total_spent);

    usersWithSpending.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.display_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Total Spent: ${user.total_spent.toLocaleString()} credits`);
      console.log(`   Transaction Count: ${user.transaction_count}`);
      console.log(`   Transactions:`);
      
      user.transactions.forEach((tx, txIndex) => {
        const date = new Date(tx.created_at).toLocaleDateString();
        console.log(`      ${txIndex + 1}. ${tx.transaction_type} - ${Math.abs(tx.amount)} credits (${date})`);
        if (tx.description) {
          console.log(`         ${tx.description}`);
        }
      });
    });

    console.log("\n" + "=" .repeat(80));

    // Show breakdown by transaction type
    const typeBreakdown: Record<string, { count: number; total: number }> = {};
    spentTransactions.forEach((tx: SpentTransaction) => {
      if (!typeBreakdown[tx.transaction_type]) {
        typeBreakdown[tx.transaction_type] = { count: 0, total: 0 };
      }
      typeBreakdown[tx.transaction_type].count++;
      typeBreakdown[tx.transaction_type].total += Math.abs(tx.amount);
    });

    console.log("\n📈 BREAKDOWN BY TRANSACTION TYPE");
    console.log("=" .repeat(80));
    Object.entries(typeBreakdown)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([type, stats]) => {
        console.log(`${type}: ${stats.count} transactions, ${stats.total.toLocaleString()} credits`);
      });
    console.log("=" .repeat(80));

  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
  }
}

checkSpentCredits()
  .then(() => {
    console.log("\n✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

