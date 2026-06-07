import { hasServiceRoleKey } from "@/lib/supabase/env";

type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

export function isSupabaseError(error: unknown): error is SupabaseErrorLike {
  return typeof error === "object" && error !== null && "message" in error;
}

export function formatSupabaseError(error: unknown): string {
  let message: string;
  if (isSupabaseError(error)) {
    const parts = [error.message, error.details, error.hint].filter(Boolean);
    message = parts.join(" — ");
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = "Unknown database error";
  }

  if (/row-level security/i.test(message) && !hasServiceRoleKey()) {
    message +=
      " Add SUPABASE_SERVICE_ROLE_KEY to .env.local (Supabase → Settings → API → service_role), save the file, restart the dev server, or run supabase/beta_rls_policies.sql.";
  }

  return message;
}

export function serializeApiError(error: unknown) {
  if (isSupabaseError(error)) {
    return {
      error: formatSupabaseError(error),
      code: error.code ?? null,
      details: error.details ?? null,
      hint: error.hint ?? null
    };
  }
  if (error instanceof Error) {
    return {
      error: error.message,
      code: null,
      details: null,
      hint: null
    };
  }
  return {
    error: "Unknown error",
    code: null,
    details: null,
    hint: null
  };
}
