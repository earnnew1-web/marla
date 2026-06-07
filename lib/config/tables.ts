import { isBetaEnv, isProductionEnv } from "@/lib/config/env";

const isBeta = isBetaEnv();

export const TABLES = {
  orders: isBeta ? "beta_orders" : "orders",
  customers: isBeta ? "beta_customers" : "customers",
  filmRolls: isBeta ? "beta_film_rolls" : "film_rolls",
  adminUsers: isBeta ? "beta_admin_users" : "admin_users",
  payments: isBeta ? "beta_payments" : "payments",
  /** No dedicated beta table — shared or falls back to defaults in app code. */
  pricingSettings: "pricing_settings"
} as const;

export type TableKey = keyof typeof TABLES;

if (process.env.NODE_ENV === "development") {
  if (isBeta) {
    console.log("Using Beta Tables", TABLES);
  } else if (isProductionEnv()) {
    console.log("Using Production Tables", TABLES);
  } else {
    console.log("Using Production Tables (development default)", TABLES);
  }
}
