/**
 * Authentication and authorization utilities for role-based access control
 */

import { supabase } from "@/integrations/supabase/client";

function fromUntyped(table: string) {
  return (supabase as unknown as { from: (name: string) => any }).from(table);
}

export type UserRole = "admin" | "brand" | "dj";

export interface UserProfile {
  id: string;
  role: UserRole;
  email: string;
  first_name: string;
  last_name: string;
  dj_name: string;
  brand_name?: string | null;
  brand_account_id?: string | null;
}

/**
 * Fetches the current user's profile including their role
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await fromUntyped("user_profiles")
      .select("id, role, email, first_name, last_name, dj_name, brand_name, brand_account_id")
      .eq("id", user.id)
      .single();

    const row =
      profileError && /brand_account_id/i.test(profileError.message || "")
        ? (
            await fromUntyped("user_profiles")
              .select("id, role, email, first_name, last_name, dj_name, brand_name")
              .eq("id", user.id)
              .single()
          ).data
        : profile;

    if ((!profile && !row) || (profileError && !row)) {
      return null;
    }

    const resolved = (row || profile) as {
      id: string;
      role: string | null;
      email: string;
      first_name: string;
      last_name: string;
      dj_name: string;
      brand_name?: string | null;
      brand_account_id?: string | null;
    };

    return {
      id: resolved.id,
      role: (resolved.role as UserRole) || (resolved.brand_name ? "brand" : "admin"),
      email: resolved.email,
      first_name: resolved.first_name,
      last_name: resolved.last_name,
      dj_name: resolved.dj_name,
      brand_name: resolved.brand_name,
      brand_account_id: resolved.brand_account_id ?? null,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

/**
 * Checks if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === "admin";
}

/**
 * Checks if the current user is a brand
 */
export async function isBrand(): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  return profile?.role === "brand";
}

/**
 * Gets the current user's ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error("Error fetching user ID:", error);
    return null;
  }
}

