/**
 * Authentication and authorization utilities for role-based access control
 */

import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "brand" | "dj";

export interface UserProfile {
  id: string;
  role: UserRole;
  email: string;
  first_name: string;
  last_name: string;
  dj_name: string;
  brand_name?: string | null;
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

    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("id, role, email, first_name, last_name, dj_name, brand_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return {
      id: profile.id,
      role: (profile.role as UserRole) || "admin",
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      dj_name: profile.dj_name,
      brand_name: profile.brand_name,
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

