"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Live-updates when a DJ applies (simple application or custom form)
 * so applicant counts and the applications list change without a refresh.
 *
 * Pass `"all"` for the global applications inbox.
 * Pass `null` or `[]` to stay idle.
 */
export function useApplicationsRealtime(
  scope: string[] | "all" | null,
  onChange: (opportunityId: string | null) => void
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const idsKey =
    scope === "all"
      ? "*"
      : (scope || []).filter(Boolean).sort().join(",");

  useEffect(() => {
    if (!idsKey) return;

    const ids = idsKey === "*" ? [] : idsKey.split(",");
    const single = ids.length === 1 ? ids[0] : null;
    const filter = single ? `opportunity_id=eq.${single}` : undefined;

    const notify = (payload?: {
      new?: { opportunity_id?: string };
      old?: { opportunity_id?: string };
    }) => {
      const id =
        payload?.new?.opportunity_id ||
        payload?.old?.opportunity_id ||
        single ||
        null;
      onChangeRef.current(id);
    };

    const appsChannel = supabase
      .channel(`applications-live-${idsKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "applications",
          ...(filter ? { filter } : {}),
        },
        notify
      )
      .subscribe();

    const formsChannel = supabase
      .channel(`form-responses-live-${idsKey}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "application_form_responses",
          ...(filter ? { filter } : {}),
        },
        notify
      )
      .subscribe();

    const poll = () => notify();
    const interval = window.setInterval(poll, 4000);
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    window.addEventListener("focus", poll);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", poll);
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(appsChannel);
      supabase.removeChannel(formsChannel);
    };
  }, [idsKey]);
}
