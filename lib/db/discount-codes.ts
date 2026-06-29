import { TABLES } from "@/lib/config/tables";
import {
  COUNTABLE_ORDER_STATUSES,
  FIRST_ORDER_CODE_PREFIX,
  formatFirstOrderDiscountCode
} from "@/lib/discount-codes";
import { isWelcomeCouponCode } from "@/lib/customer-coupons";
import { discountValidationError, type DiscountErrorCode } from "@/lib/discount-errors";
import { validateCustomerCouponForOrder } from "@/lib/db/customer-coupons";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { DiscountCode } from "@/lib/types";

type DbDiscountCodeRow = {
  id: string;
  code: string;
  type: string;
  discount_type: string;
  discount_value: number;
  usage_limit: number;
  used_count: number;
  active: boolean;
  created_at: string;
  expires_at: string | null;
};

function mapDiscountCode(row: DbDiscountCodeRow): DiscountCode {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    usageLimit: row.usage_limit,
    usedCount: row.used_count,
    active: row.active,
    createdAt: row.created_at,
    expiresAt: row.expires_at
  };
}

export async function fetchDiscountCodesFromDb(): Promise<DiscountCode[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.discountCodes)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return (data ?? []).map((row) => mapDiscountCode(row as DbDiscountCodeRow));
}

export async function generateFirstOrderDiscountCode(): Promise<DiscountCode> {
  const supabase = createAdminSupabaseClient();

  const { count, error: countError } = await supabase
    .from(TABLES.discountCodes)
    .select("id", { count: "exact", head: true })
    .like("code", `${FIRST_ORDER_CODE_PREFIX}%`);

  if (countError) {
    throw new Error(formatSupabaseError(countError));
  }

  const code = formatFirstOrderDiscountCode((count ?? 0) + 1);

  const { data, error } = await supabase
    .from(TABLES.discountCodes)
    .insert({
      code,
      type: "first_order",
      discount_type: "fixed",
      discount_value: 50,
      usage_limit: 1,
      used_count: 0,
      active: true
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return mapDiscountCode(data as DbDiscountCodeRow);
}

export async function setDiscountCodeActive(id: string, active: boolean): Promise<DiscountCode> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.discountCodes)
    .update({ active })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return mapDiscountCode(data as DbDiscountCodeRow);
}

type CustomerIdentity = {
  lineUserId?: string | null;
  phone?: string | null;
  email?: string | null;
  customerId?: string | null;
};

async function customerHasCountableOrders(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  field: "line_user_id" | "phone" | "email",
  value: string
): Promise<boolean> {
  const customerTable = TABLES.customers;
  const { count, error } = await supabase
    .from(TABLES.orders)
    .select(`id, customer:${customerTable}!inner(${field})`, { count: "exact", head: true })
    .eq(`customer.${field}`, value)
    .neq("status", "Cancelled")
    .in("status", [...COUNTABLE_ORDER_STATUSES]);

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return (count ?? 0) > 0;
}

export async function isFirstTimeCustomer(identity: CustomerIdentity): Promise<boolean> {
  const supabase = createAdminSupabaseClient();
  const checks: Promise<boolean>[] = [];

  const lineUserId = identity.lineUserId?.trim();
  if (lineUserId) {
    checks.push(customerHasCountableOrders(supabase, "line_user_id", lineUserId));
  }

  const phone = identity.phone?.trim();
  if (phone) {
    checks.push(customerHasCountableOrders(supabase, "phone", phone));
  }

  const email = identity.email?.trim().toLowerCase();
  if (email) {
    checks.push(customerHasCountableOrders(supabase, "email", email));
  }

  if (checks.length === 0) {
    return true;
  }

  const results = await Promise.all(checks);
  return !results.some(Boolean);
}

export type DiscountValidationResult =
  | { valid: true; code: DiscountCode }
  | { valid: false; error: string; errorCode: DiscountErrorCode };

export type { DiscountErrorCode };

export async function validateDiscountCodeForOrder(
  rawCode: string,
  identity: CustomerIdentity
): Promise<DiscountValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return discountValidationError("invalid", "Please enter a discount code.");
  }

  if (isWelcomeCouponCode(code)) {
    return validateCustomerCouponForOrder(code, identity);
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.discountCodes)
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  if (!data) {
    return discountValidationError("invalid", "Discount code not found.");
  }

  const discountCode = mapDiscountCode(data as DbDiscountCodeRow);

  if (!discountCode.active) {
    return discountValidationError("not_eligible", "This discount code is no longer active.");
  }

  if (discountCode.expiresAt && new Date(discountCode.expiresAt).getTime() <= Date.now()) {
    return discountValidationError("expired", "This discount code has expired.");
  }

  if (discountCode.usedCount >= discountCode.usageLimit) {
    return discountValidationError("already_used", "This discount code has already been used.");
  }

  if (discountCode.type === "first_order") {
    const firstTime = await isFirstTimeCustomer(identity);
    if (!firstTime) {
      return discountValidationError("not_eligible", "This discount is not available for this order.");
    }
  }

  return {
    valid: true,
    code: { ...discountCode, source: "discount_code" as const }
  };
}

export async function incrementDiscountCodeUsage(codeId: string): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const { data: current, error: readError } = await supabase
    .from(TABLES.discountCodes)
    .select("used_count, usage_limit")
    .eq("id", codeId)
    .single();

  if (readError) {
    throw new Error(formatSupabaseError(readError));
  }

  if (current.used_count >= current.usage_limit) {
    throw new Error("Discount code usage limit reached.");
  }

  const { error: updateError } = await supabase
    .from(TABLES.discountCodes)
    .update({ used_count: current.used_count + 1 })
    .eq("id", codeId)
    .eq("used_count", current.used_count);

  if (updateError) {
    throw new Error(formatSupabaseError(updateError));
  }
}
