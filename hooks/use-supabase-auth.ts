"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { Json, Database } from "@/lib/supabase/database.types";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { LocalLibrary } from "@/hooks/use-local-library";

type AuthMode = "signin" | "signup" | "recovery";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "L’opération n’a pas pu aboutir.";
}

function getDeviceId() {
  const key = "rihla.device.id";
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(key, created);
    return created;
  } catch {
    return `browser-${crypto.randomUUID()}`;
  }
}

export function useSupabaseAuth(localLibrary: LocalLibrary, hydrated: boolean) {
  const client = getSupabaseBrowserClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(client));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const migratedUserRef = useRef<string | null>(null);

  useEffect(() => {
    if (!client) {
      const frame = window.requestAnimationFrame(() => setLoading(false));
      return () => window.cancelAnimationFrame(frame);
    }

    let active = true;
    let frame = 0;
    const commit = (callback: () => void) => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (active) callback();
      });
    };

    void client.auth.getSession().then(({ data, error: sessionError }) => {
      commit(() => {
        setSession(data.session);
        setLoading(false);
        if (sessionError) setError(sessionError.message);
      });
    });

    const { data: authState } = client.auth.onAuthStateChange((_event, nextSession) => {
      commit(() => {
        setSession(nextSession);
        setLoading(false);
      });
    });

    return () => {
      active = false;
      window.cancelAnimationFrame(frame);
      authState.subscription.unsubscribe();
    };
  }, [client]);

  const ensureProfile = useCallback(async (user: User) => {
    if (!client) return;
    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const displayName = typeof metadata?.display_name === "string" ? metadata.display_name.trim().slice(0, 120) : null;
    const { error: profileError } = await client.from("profiles").upsert({ id: user.id, display_name: displayName }, { onConflict: "id" });
    if (profileError) throw profileError;
  }, [client]);

  const migrateGuestLibrary = useCallback(async (user: User) => {
    if (!client || !hydrated || migratedUserRef.current === user.id) return;
    const marker = `rihla.guest-migrated.${user.id}`;
    try {
      if (window.localStorage.getItem(marker) === "1") {
        migratedUserRef.current = user.id;
        return;
      }
    } catch {
      // A blocked localStorage must not prevent an authenticated session.
    }

    const payload = { schemaVersion: localLibrary.version, library: localLibrary } as unknown as Json;
    const row: Database["public"]["Tables"]["user_sync_events"]["Insert"] = {
      user_id: user.id,
      device_id: getDeviceId(),
      entity: "local_library",
      operation: "UPSERT",
      entity_id: "guest-snapshot",
      payload,
      client_updated_at: new Date().toISOString(),
    };
    const { error: syncError } = await client.from("user_sync_events").insert(row);
    if (syncError) throw syncError;
    migratedUserRef.current = user.id;
    try {
      window.localStorage.setItem(marker, "1");
    } catch {
      // The server event is already durable; the marker is only an optimization.
    }
  }, [client, hydrated, localLibrary]);

  useEffect(() => {
    if (!session?.user) return;
    void ensureProfile(session.user).catch((profileError: unknown) => setError(errorMessage(profileError)));
    void migrateGuestLibrary(session.user).catch((syncError: unknown) => setError(errorMessage(syncError)));
  }, [ensureProfile, migrateGuestLibrary, session?.user]);

  const run = useCallback(async (operation: () => Promise<void>) => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      await operation();
    } catch (operationError) {
      setError(errorMessage(operationError));
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback((email: string, password: string, displayName: string) => run(async () => {
    if (!client) throw new Error("Supabase n’est pas configuré.");
    const { data, error: signUpError } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: displayName.trim().slice(0, 120) } },
    });
    if (signUpError) throw signUpError;
    setNotice(data.session ? "Compte créé · vos données locales sont en cours de migration." : "Compte créé · vérifiez votre email pour activer la session.");
  }), [client, run]);

  const signIn = useCallback((email: string, password: string) => run(async () => {
    if (!client) throw new Error("Supabase n’est pas configuré.");
    const { error: signInError } = await client.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) throw signInError;
    setNotice("Connexion réussie · vos données locales sont vérifiées.");
  }), [client, run]);

  const signOut = useCallback(() => run(async () => {
    if (!client) return;
    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) throw signOutError;
    migratedUserRef.current = null;
    setNotice("Vous êtes déconnecté · le mode invité reste disponible sur cet appareil.");
  }), [client, run]);

  const requestPasswordReset = useCallback((email: string) => run(async () => {
    if (!client) throw new Error("Supabase n’est pas configuré.");
    const redirectTo = typeof window === "undefined" ? undefined : `${window.location.origin}/?auth=recovery`;
    const { error: resetError } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (resetError) throw resetError;
    setNotice("Email de réinitialisation envoyé si cette adresse possède un compte.");
  }), [client, run]);

  const updateEmail = useCallback((email: string) => run(async () => {
    if (!client) throw new Error("Supabase n’est pas configuré.");
    const { error: updateError } = await client.auth.updateUser({ email: email.trim() });
    if (updateError) throw updateError;
    setNotice("Un email de confirmation a été envoyé à la nouvelle adresse.");
  }), [client, run]);

  const updatePassword = useCallback((password: string) => run(async () => {
    if (!client) throw new Error("Supabase n’est pas configuré.");
    const { error: updateError } = await client.auth.updateUser({ password });
    if (updateError) throw updateError;
    setNotice("Mot de passe mis à jour.");
  }), [client, run]);

  const deleteAccount = useCallback(() => run(async () => {
    if (!client) throw new Error("Supabase n’est pas configuré.");
    const { error: deleteError } = await client.functions.invoke("delete-account", { method: "POST" });
    if (deleteError) throw deleteError;
    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) throw signOutError;
    migratedUserRef.current = null;
    setNotice("Compte supprimé. Le mode invité reste disponible sur cet appareil.");
  }), [client, run]);

  return {
    configured: Boolean(client),
    loading,
    user: session?.user ?? null,
    mode: session ? "authenticated" : "guest",
    error,
    notice,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    updateEmail,
    updatePassword,
    deleteAccount,
    clearMessages: () => { setError(null); setNotice(null); },
  };
}

export type SupabaseAuthState = ReturnType<typeof useSupabaseAuth>;
export type { AuthMode };
