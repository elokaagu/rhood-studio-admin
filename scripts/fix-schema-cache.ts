/**
 * Script to fix Supabase schema cache issue (PGRST205)
 * This script sends a notification to PostgREST to refresh its schema cache
 * Run with: npx tsx scripts/fix-schema-cache.ts
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

async function fixSchemaCache() {
  console.log("🔧 Attempting to fix Supabase schema cache...\n");

  try {
    // Try to trigger schema cache refresh via RPC if available
    // This might not work with anon key, but worth trying
    try {
      // @ts-ignore
      const { error: rpcError } = await supabase.rpc('pgrst_reload_schema');
      if (!rpcError) {
        console.log("✅ Schema cache refresh triggered via RPC");
        return;
      }
    } catch (e) {
      // RPC might not exist or require service role key - that's okay
    }

    // Alternative: Try to query the table to trigger cache refresh
    // @ts-ignore
    const { error: queryError } = await supabase
      .from('credit_transactions')
      .select('id')
      .limit(1);

    if (queryError) {
      if (queryError.code === 'PGRST205' || queryError.message?.includes('schema cache')) {
        console.log("⚠️  Schema cache error detected. This script can't directly fix it.");
        console.log("\n📋 MANUAL FIX REQUIRED:");
        console.log("=" .repeat(80));
        console.log("Option 1: Run SQL Script in Supabase Dashboard");
        console.log("1. Go to your Supabase Dashboard");
        console.log("2. Open SQL Editor");
        console.log("3. Run: supabase/migrations/FIX_SCHEMA_CACHE_PGRST205.sql");
        console.log("4. Wait 10-30 seconds");
        console.log("5. Refresh your browser\n");
        console.log("Option 2: Use Supabase Dashboard UI");
        console.log("1. Go to Supabase Dashboard");
        console.log("2. Settings → API");
        console.log("3. Scroll to 'Schema Cache' section");
        console.log("4. Click 'Refresh Schema Cache' or 'Reload'");
        console.log("5. Wait 10-30 seconds");
        console.log("6. Refresh your browser\n");
        console.log("=" .repeat(80));
      } else {
        console.error("❌ Error querying credit_transactions:", queryError);
      }
    } else {
      console.log("✅ credit_transactions table is accessible! Schema cache is working.");
    }

  } catch (error: any) {
    console.error("❌ Unexpected error:", error);
    console.log("\n📋 MANUAL FIX REQUIRED - See instructions above.");
  }
}

fixSchemaCache()
  .then(() => {
    console.log("\n✅ Script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

