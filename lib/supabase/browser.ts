"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabasePublicConfig } from "./env";

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Returns null in local guest mode. Once the public Supabase variables exist,
 * the SSR client persists the session in cookies without exposing a secret key.
 */
export function getSupabaseBrowserClient() {
  const config = getSupabasePublicConfig();
  if (!config) return null;
  browserClient ??= createBrowserClient<Database>(config.url, config.publishableKey);
  return browserClient;
}
