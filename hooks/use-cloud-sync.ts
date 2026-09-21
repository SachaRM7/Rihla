"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { LocalLibrary } from "@/hooks/use-local-library";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { clearSyncOutbox, hasSyncOutbox, saveSyncOutbox, syncCloudLibrary, syncInitializedKey, type CloudSyncStatus } from "@/lib/supabase/sync";

type Props = {
  user: User | null;
  localLibrary: LocalLibrary;
  hydrated: boolean;
  restoreLibrary: (raw: string) => boolean;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "La synchronisation n’a pas pu aboutir.";
}

export function useCloudSync({ user, localLibrary, hydrated, restoreLibrary }: Props) {
  const client = getSupabaseBrowserClient();
  const libraryRef = useRef(localLibrary);
  const restoreRef = useRef(restoreLibrary);
  const busyRef = useRef(false);
  const queuedRef = useRef(false);
  const initializedRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<CloudSyncStatus>(client && user ? "idle" : "disabled");
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => { libraryRef.current = localLibrary; }, [localLibrary]);
  useEffect(() => { restoreRef.current = restoreLibrary; }, [restoreLibrary]);

  const syncNow = useCallback(async () => {
    if (!client || !user || !hydrated) return;
    if (busyRef.current) {
      queuedRef.current = true;
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setPending(true);
      setStatus("offline");
      saveSyncOutbox(user.id, libraryRef.current);
      return;
    }

    busyRef.current = true;
    setStatus("syncing");
    setError(null);
    try {
      const merged = await syncCloudLibrary(client, user, libraryRef.current);
      if (JSON.stringify(merged) !== JSON.stringify(libraryRef.current)) restoreRef.current(JSON.stringify(merged));
      try { window.localStorage.setItem(syncInitializedKey(user.id), "1"); } catch { /* best effort */ }
      clearSyncOutbox();
      setPending(false);
      setLastSyncedAt(Date.now());
      setStatus("synced");
      initializedRef.current = true;
    } catch (syncError) {
      const message = errorMessage(syncError);
      saveSyncOutbox(user.id, libraryRef.current);
      setPending(true);
      setError(message);
      setStatus("error");
    } finally {
      busyRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        window.setTimeout(() => void syncNow(), 0);
      }
    }
  }, [client, hydrated, user]);

  useEffect(() => {
    initializedRef.current = false;
    if (!client || !user || !hydrated) {
      setStatus(client ? "idle" : "disabled");
      setPending(false);
      return;
    }
    let marker = false;
    try { marker = window.localStorage.getItem(syncInitializedKey(user.id)) === "1"; } catch { /* best effort */ }
    initializedRef.current = marker;
    setPending(hasSyncOutbox(user.id));
    void syncNow();
  }, [client, hydrated, syncNow, user]);

  useEffect(() => {
    if (!client || !user || !hydrated || !initializedRef.current) return;
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => void syncNow(), 1_200);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [client, hydrated, localLibrary, syncNow, user]);

  useEffect(() => {
    if (!client || !user) return;
    const reconnect = () => void syncNow();
    window.addEventListener("online", reconnect);
    document.addEventListener("visibilitychange", reconnect);
    return () => {
      window.removeEventListener("online", reconnect);
      document.removeEventListener("visibilitychange", reconnect);
    };
  }, [client, syncNow, user]);

  return { status, error, lastSyncedAt, pending, syncNow };
}
