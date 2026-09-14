"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved";

export function useAutosaveDraft<T>(options: {
  storageKey: string;
  value: T;
  onRestore: (value: T) => void;
  enabled?: boolean;
  debounceMs?: number;
}): { status: AutosaveStatus; clear: () => void } {
  const {
    storageKey,
    value,
    onRestore,
    enabled = true,
    debounceMs = 500,
  } = options;
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [hydrated, setHydrated] = useState(false);
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;
  const restoredKeyRef = useRef<string | null>(null);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore quota / private mode */
    }
    setStatus("idle");
  }, [storageKey]);

  useEffect(() => {
    if (!enabled) {
      setHydrated(false);
      restoredKeyRef.current = null;
      return;
    }
    if (restoredKeyRef.current === storageKey) return;
    restoredKeyRef.current = storageKey;

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        onRestoreRef.current(JSON.parse(raw) as T);
      }
    } catch {
      /* ignore invalid JSON */
    }
    setHydrated(true);
  }, [enabled, storageKey]);

  useEffect(() => {
    if (!enabled || !hydrated) return;

    setStatus("saving");
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
        setStatus("saved");
      } catch {
        setStatus("idle");
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, enabled, hydrated, storageKey, value]);

  return { status, clear };
}

export function AutosaveStatusText({ status }: { status: AutosaveStatus }) {
  if (status === "idle") return null;
  return (
    <p className="text-xs text-muted-foreground mr-auto">
      {status === "saving" ? "Saving draft…" : "Draft autosaved"}
    </p>
  );
}
