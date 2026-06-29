import { isBetaEnv, isProductionEnv } from "@/lib/config/env";

const isBeta = isBetaEnv();

export const TABLES = {
  orders: isBeta ? "beta_orders" : "orders",
  customers: isBeta ? "beta_customers" : "customers",
  filmRolls: isBeta ? "beta_film_rolls" : "film_rolls",
  adminUsers: isBeta ? "beta_admin_users" : "admin_users",
  payments: isBeta ? "beta_payments" : "payments",
  /** Shared table — same name in all environments. */
  pricingSettings: "pricing_settings",
  discountCodes: "discount_codes",
  customerCoupons: "customer_coupons"
} as const;

export type TableKey = keyof typeof TABLES;

if (process.env.NODE_ENV === "development") {
  if (isProductionEnv()) {
    console.log("Using production tables", TABLES);
  } else {
    console.log("Using database tables", TABLES);
  }
}
