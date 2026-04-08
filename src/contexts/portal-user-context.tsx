"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { UserRole } from "@/lib/auth-utils";

export type PortalProfileSnapshot = {
  id: string;
  role: UserRole | null;
  first_name: string;
  last_name: string;
  dj_name: string;
  brand_name: string | null;
  credits: number;
};

export type PortalUserStatus = "loading" | "ready" | "error";

export type PortalUserContextValue = {
  status: PortalUserStatus;
  errorMessage: string | null;
  authUser: User | null;
  profile: PortalProfileSnapshot | null;
  /** Only valid roles from the database; never inferred as admin on failure */
  role: UserRole | null;
  displayName: string;
  credits: number;
  refresh: () => Promise<void>;
};

const PortalUserContext = createContext<PortalUserContextValue | null>(null);

function parseRole(value: unknown): UserRole | null {
  if (value === "admin" || value === "brand" || value === "dj") return value;
  return null;
}

function computeDisplayName(
  profile: PortalProfileSnapshot | null,
  email: string | undefined
): string {
  if (!profile) {
    const fallback = email?.split("@")[0] || "R/HOOD TEAM";
    return fallback.toUpperCase();
  }
  if (profile.role === "brand") {
    return (profile.brand_name?.trim() || "BRAND").toUpperCase();
  }
  const name =
    profile.dj_name?.trim() ||
    [profile.first_name, profile.last_name]
      .map((part) => (part ? part.trim() : ""))
      .filter(Boolean)
      .join(" ") ||
    email?.split("@")[0] ||
    "R/HOOD TEAM";
  return name.toUpperCase();
}

type UserProfilesRow = {
  id: string;
  role: string | null;
  first_name: string | null;
  last_name: string | null;
  dj_name: string | null;
  brand_name: string | null;
  credits?: number | null;
};

function rowToSnapshot(row: UserProfilesRow): PortalProfileSnapshot {
  const rawCredits = row.credits;
  const credits =
    typeof rawCredits === "number" && !Number.isNaN(rawCredits)
      ? rawCredits
      : 0;

  return {
    id: row.id,
    role: parseRole(row.role),
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    dj_name: row.dj_name ?? "",
    brand_name: row.brand_name ?? null,
    credits,
  };
}

export function PortalUserProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<PortalUserStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PortalProfileSnapshot | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setAuthUser(null);
        setProfile(null);
        setStatus("ready");
        return;
      }

      setAuthUser(user);

      const { data: row, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, role, first_name, last_name, dj_name, brand_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setProfile(null);
        setErrorMessage(profileError.message);
        setStatus("error");
        return;
      }

      if (!row) {
        setProfile(null);
        setStatus("ready");
        return;
      }

      let credits = 0;
      try {
        const { data: creditsRow } = await (supabase.from as unknown as {
          from: (table: string) => {
            select: (columns: string) => {
              eq: (column: string, value: string) => {
                maybeSingle: () => Promise<{
                  data: { credits?: unknown } | null;
                }>;
              };
            };
          };
        })
          .from("user_profiles")
          .select("credits")
          .eq("id", user.id)
          .maybeSingle();

        if (creditsRow && typeof creditsRow.credits === "number") {
          credits = creditsRow.credits;
        }
      } catch {
        // Keep credits at 0 when the column is absent in generated types or schema.
      }

      setProfile(
        rowToSnapshot({
          id: row.id,
          role: row.role,
          first_name: row.first_name,
          last_name: row.last_name,
          dj_name: row.dj_name,
          brand_name: row.brand_name,
          credits,
        })
      );
      setStatus("ready");
    } catch (e) {
      setProfile(null);
      setErrorMessage(e instanceof Error ? e.message : "Failed to load profile.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const role = profile?.role ?? null;
  const credits = profile?.credits ?? 0;
  const displayName = useMemo(
    () => computeDisplayName(profile, authUser?.email),
    [profile, authUser?.email]
  );

  const value = useMemo<PortalUserContextValue>(
    () => ({
      status,
      errorMessage,
      authUser,
      profile,
      role,
      displayName,
      credits,
      refresh: load,
    }),
    [status, errorMessage, authUser, profile, role, displayName, credits, load]
  );

  return (
    <PortalUserContext.Provider value={value}>{children}</PortalUserContext.Provider>
  );
}

export function usePortalUser(): PortalUserContextValue {
  const ctx = useContext(PortalUserContext);
  if (!ctx) {
    throw new Error("usePortalUser must be used within PortalUserProvider");
  }
  return ctx;
}
