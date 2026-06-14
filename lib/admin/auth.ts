import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const ADMIN_AUTH_COOKIE = "mfl-admin-auth";

const DEFAULT_ADMIN_PASSWORD = "admin123";

export function getAdminPassword() {
  const configured = process.env.ADMIN_BETA_PASSWORD?.trim();
  return configured || DEFAULT_ADMIN_PASSWORD;
}

/** @deprecated Use getAdminPassword */
export const getAdminBetaPassword = getAdminPassword;

export function verifyAdminPassword(password: string) {
  const expected = getAdminPassword();
  if (!expected) return false;
  return password === expected;
}

export function isAdminRequestAuthenticated(request: NextRequest) {
  return request.cookies.get(ADMIN_AUTH_COOKIE)?.value === "1";
}

export async function isAdminSessionActive() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_AUTH_COOKIE)?.value === "1";
}
