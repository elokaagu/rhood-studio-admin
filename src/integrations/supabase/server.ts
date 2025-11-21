import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Create a Supabase client for server-side use
  // Authentication will be handled via cookies automatically by Supabase
  const client = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  // Get the session from cookies
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  const refreshToken = cookieStore.get("sb-refresh-token")?.value;

  // If we have tokens, set them in the client
  if (accessToken) {
    // Set the session manually
    await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || "",
    } as any).catch(() => {
      // If setting session fails, continue without it
      // The client will still work for public queries
    });
  }

  return client;
}

