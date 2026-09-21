import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";
import type { Database } from "@/lib/types/database";

/**
 * Cookie-free client for public pages that are statically rendered / ISR.
 * It reads only what RLS exposes anonymously, so it never sees hidden content.
 * Use this in public page data loaders; use server.ts wherever auth matters.
 */
export function createPublicClient() {
  const { url, key } = supabaseEnv();
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
