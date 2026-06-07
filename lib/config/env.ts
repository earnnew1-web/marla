export type AppEnv = "development" | "beta" | "production";

export function getAppEnv(): AppEnv {
  const value = process.env.NEXT_PUBLIC_APP_ENV;
  if (value === "beta" || value === "production") return value;
  return "development";
}

export function isBetaEnv() {
  return getAppEnv() === "beta";
}

export function isProductionEnv() {
  return getAppEnv() === "production";
}
