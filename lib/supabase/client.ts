import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

let client: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!client) {
    const { url, anonKey } = getSupabasePublicEnv();
    client = createClient(url, anonKey);
  }
  return client;
}

/** Lazy singleton — avoids SSR crash when env is unavailable at module load. */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseClient(), prop, receiver);
  }
});
