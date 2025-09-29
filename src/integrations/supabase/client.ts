import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Get Supabase credentials from environment variables
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// Validate that environment variables are set (only in development)
if (process.env.NODE_ENV === "development") {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("Missing env.NEXT_PUBLIC_SUPABASE_URL - using placeholder");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn(
      "Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY - using placeholder"
    );
  }
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
