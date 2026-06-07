function trim(value: string | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

export function getSupabasePublicEnv() {
  // Static property access — Next.js only inlines NEXT_PUBLIC_* this way in client bundles.
  const url = trim(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey =
    trim(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    trim(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!url || !anonKey) {
    const missing = [
      !url ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null
    ]
      .filter(Boolean)
      .join(", ");

    throw new Error(
      `Supabase is not configured. Missing ${missing}. Add them to .env.local at the project root and restart the dev server.`
    );
  }

  return { url, anonKey };
}

export function getServiceRoleKey() {
  const key = trim(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local (Supabase → Settings → API → service_role), save the file, and restart the dev server."
    );
  }
  return key;
}

export function hasServiceRoleKey() {
  return Boolean(trim(process.env.SUPABASE_SERVICE_ROLE_KEY));
}
