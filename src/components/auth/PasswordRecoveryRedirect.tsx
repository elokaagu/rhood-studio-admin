"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";

/**
 * Sends password-reset links to /reset-password even when Supabase falls back
 * to the Site URL (e.g. /reset-password missing from the redirect allow list).
 */
export function PasswordRecoveryRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (
      pathname !== "/reset-password" &&
      /(^|&)type=recovery(&|$)/.test(window.location.hash.substring(1))
    ) {
      router.replace(`/reset-password${window.location.hash}`);
      return;
    }
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && pathname !== "/reset-password") {
        router.replace("/reset-password");
      }
    });
    return () => data.subscription.unsubscribe();
  }, [pathname, router]);

  return null;
}
