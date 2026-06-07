import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabasePublicEnv } from "@/lib/supabase/env";

/** Server-side client — anon key (respects RLS). */
export function createServerSupabaseClient(): SupabaseClient {
  const { url, anonKey } = getSupabasePublicEnv();
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

/** Server-side client — service role (bypasses RLS). Required for writes. */
export function createAdminSupabaseClient(): SupabaseClient {
  const { url } = getSupabasePublicEnv();
  const serviceRole = getServiceRoleKey();

  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
