import { TABLES } from "@/lib/config/tables";
import {
  formatWelcomeCouponCode,
  generateWelcomeCouponSuffix,
  isWelcomeCouponCode,
  welcomeCouponExpiresAt,
  WELCOME_COUPON_DISCOUNT_VALUE
} from "@/lib/customer-coupons";
import { isFirstTimeCustomer, type DiscountValidationResult } from "@/lib/db/discount-codes";
import { discountValidationError } from "@/lib/discount-errors";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { CustomerCoupon } from "@/lib/types";

type DbCustomerCouponRow = {
  id: string;
  code: string;
  customer_id: string | null;
  line_user_id: string | null;
  discount_type: string;
  discount_value: number;
  applies_to: string;
  usage_limit: number;
  used_count: number;
  is_used: boolean;
  active: boolean;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

function mapCustomerCoupon(row: DbCustomerCouponRow): CustomerCoupon {
  return {
    id: row.id,
    code: row.code,
    customerId: row.customer_id,
    lineUserId: row.line_user_id,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    appliesTo: row.applies_to,
    usageLimit: row.usage_limit,
    usedCount: row.used_count,
    isUsed: row.is_used,
    active: row.active,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at
  };
}

function isCouponCurrentlyValid(coupon: CustomerCoupon): boolean {
  if (!coupon.active) return false;
  if (coupon.isUsed) return false;
  if (coupon.usedCount >= coupon.usageLimit) return false;
  return new Date(coupon.expiresAt).getTime() > Date.now();
}

type CustomerIdentity = {
  lineUserId?: string | null;
  phone?: string | null;
  email?: string | null;
  customerId?: string | null;
};

async function findCouponByLineUserId(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  lineUserId: string
): Promise<CustomerCoupon | null> {
  const { data, error } = await supabase
    .from(TABLES.customerCoupons)
    .select("*")
    .eq("line_user_id", lineUserId)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return data ? mapCustomerCoupon(data as DbCustomerCouponRow) : null;
}

async function findCouponByCustomerId(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  customerId: string
): Promise<CustomerCoupon | null> {
  const { data, error } = await supabase
    .from(TABLES.customerCoupons)
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return data ? mapCustomerCoupon(data as DbCustomerCouponRow) : null;
}

async function insertUniqueCoupon(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  params: { lineUserId: string; customerId?: string | null }
): Promise<CustomerCoupon> {
  const expiresAt = welcomeCouponExpiresAt();

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = formatWelcomeCouponCode(generateWelcomeCouponSuffix());
    const { data, error } = await supabase
      .from(TABLES.customerCoupons)
      .insert({
        code,
        line_user_id: params.lineUserId,
        customer_id: params.customerId ?? null,
        discount_type: "fixed",
        discount_value: WELCOME_COUPON_DISCOUNT_VALUE,
        applies_to: "first_order",
        usage_limit: 1,
        used_count: 0,
        is_used: false,
        active: true,
        expires_at: expiresAt
      })
      .select("*")
      .single();

    if (!error) {
      return mapCustomerCoupon(data as DbCustomerCouponRow);
    }

    if (error.code === "23505") {
      continue;
    }

    throw new Error(formatSupabaseError(error));
  }

  throw new Error("Could not generate a unique welcome coupon code.");
}

export async function ensureWelcomeCouponForLineUser(params: {
  lineUserId: string;
  customerId?: string | null;
}): Promise<{ coupon: CustomerCoupon; created: boolean }> {
  const lineUserId = params.lineUserId.trim();
  if (!lineUserId) {
    throw new Error("LINE user ID is required to create a welcome coupon.");
  }

  const supabase = createAdminSupabaseClient();
  const existingByLine = await findCouponByLineUserId(supabase, lineUserId);
  if (existingByLine) {
    if (params.customerId && !existingByLine.customerId) {
      const { data, error } = await supabase
        .from(TABLES.customerCoupons)
        .update({ customer_id: params.customerId })
        .eq("id", existingByLine.id)
        .select("*")
        .single();

      if (error) {
        throw new Error(formatSupabaseError(error));
      }

      return { coupon: mapCustomerCoupon(data as DbCustomerCouponRow), created: false };
    }

    return { coupon: existingByLine, created: false };
  }

  if (params.customerId) {
    const existingByCustomer = await findCouponByCustomerId(supabase, params.customerId);
    if (existingByCustomer) {
      if (!existingByCustomer.lineUserId) {
        const { data, error } = await supabase
          .from(TABLES.customerCoupons)
          .update({ line_user_id: lineUserId })
          .eq("id", existingByCustomer.id)
          .select("*")
          .single();

        if (error) {
          throw new Error(formatSupabaseError(error));
        }

        return { coupon: mapCustomerCoupon(data as DbCustomerCouponRow), created: false };
      }

      return { coupon: existingByCustomer, created: false };
    }
  }

  const coupon = await insertUniqueCoupon(supabase, {
    lineUserId,
    customerId: params.customerId ?? null
  });

  return { coupon, created: true };
}

export async function validateCustomerCouponForOrder(
  rawCode: string,
  identity: CustomerIdentity
): Promise<DiscountValidationResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) {
    return discountValidationError("invalid", "Please enter a discount code.");
  }

  if (!isWelcomeCouponCode(code)) {
    return discountValidationError("invalid", "Discount code not found.");
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.customerCoupons)
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  if (!data) {
    return discountValidationError("invalid", "Discount code not found.");
  }

  const coupon = mapCustomerCoupon(data as DbCustomerCouponRow);

  if (!coupon.active) {
    return discountValidationError("not_eligible", "This coupon is no longer active.");
  }

  if (coupon.isUsed || coupon.usedCount >= coupon.usageLimit) {
    return discountValidationError("already_used", "This coupon has already been used.");
  }

  if (new Date(coupon.expiresAt).getTime() <= Date.now()) {
    return discountValidationError("expired", "This coupon has expired.");
  }

  const lineUserId = identity.lineUserId?.trim();
  const customerId = identity.customerId?.trim();

  const ownedByLine = Boolean(lineUserId && coupon.lineUserId?.trim() === lineUserId);
  const ownedByCustomer = Boolean(customerId && coupon.customerId?.trim() === customerId);

  if (!ownedByLine && !ownedByCustomer) {
    return discountValidationError("not_eligible", "This discount is not available for this order.");
  }

  if (coupon.appliesTo === "first_order") {
    const firstTime = await isFirstTimeCustomer(identity);
    if (!firstTime) {
      return discountValidationError("not_eligible", "This discount is not available for this order.");
    }
  }

  return {
    valid: true,
    code: {
      id: coupon.id,
      code: coupon.code,
      type: coupon.appliesTo,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      usageLimit: coupon.usageLimit,
      usedCount: coupon.usedCount,
      active: coupon.active,
      createdAt: coupon.createdAt,
      expiresAt: coupon.expiresAt,
      source: "customer_coupon"
    }
  };
}

export async function markCustomerCouponUsed(couponId: string): Promise<void> {
  const supabase = createAdminSupabaseClient();
  const { data: current, error: readError } = await supabase
    .from(TABLES.customerCoupons)
    .select("used_count, usage_limit, is_used")
    .eq("id", couponId)
    .single();

  if (readError) {
    throw new Error(formatSupabaseError(readError));
  }

  if (current.is_used || current.used_count >= current.usage_limit) {
    throw new Error("Coupon usage limit reached.");
  }

  const { error: updateError } = await supabase
    .from(TABLES.customerCoupons)
    .update({
      is_used: true,
      used_count: current.used_count + 1,
      used_at: new Date().toISOString()
    })
    .eq("id", couponId)
    .eq("used_count", current.used_count)
    .eq("is_used", false);

  if (updateError) {
    throw new Error(formatSupabaseError(updateError));
  }
}

export async function fetchCustomerCouponsForAdmin(): Promise<CustomerCoupon[]> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.customerCoupons)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return (data ?? []).map((row) => mapCustomerCoupon(row as DbCustomerCouponRow));
}

export async function fetchCouponsByLineUserIds(lineUserIds: string[]): Promise<Map<string, CustomerCoupon>> {
  const uniqueIds = [...new Set(lineUserIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return new Map();
  }

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.customerCoupons)
    .select("*")
    .in("line_user_id", uniqueIds);

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  const map = new Map<string, CustomerCoupon>();
  for (const row of data ?? []) {
    const coupon = mapCustomerCoupon(row as DbCustomerCouponRow);
    if (coupon.lineUserId) {
      map.set(coupon.lineUserId, coupon);
    }
  }

  return map;
}

export function getCouponStatusLabel(coupon: CustomerCoupon | null | undefined): string {
  if (!coupon) return "—";
  if (coupon.isUsed || coupon.usedCount >= coupon.usageLimit) return "Used";
  if (!isCouponCurrentlyValid(coupon)) return "Expired";
  return "Unused";
}

export type WelcomeCouponCheckoutResult =
  | { valid: true; code: string; discountValue: number }
  | { valid: false; reason: "not_connected" | "unavailable" };

export async function checkWelcomePromoEligibility(
  identity: CustomerIdentity
): Promise<{ eligible: boolean }> {
  const lineUserId = identity.lineUserId?.trim();
  const phone = identity.phone?.trim();
  const email = identity.email?.trim();

  if (!lineUserId && !phone && !email) {
    return { eligible: true };
  }

  const firstTime = await isFirstTimeCustomer(identity);
  if (!firstTime) {
    return { eligible: false };
  }

  if (lineUserId) {
    const supabase = createAdminSupabaseClient();
    const coupon = await findCouponByLineUserId(supabase, lineUserId);
    if (coupon && (coupon.isUsed || coupon.usedCount >= coupon.usageLimit)) {
      return { eligible: false };
    }
  }

  return { eligible: true };
}

export async function resolveWelcomeCouponForCheckout(
  identity: CustomerIdentity,
  options?: { ensure?: boolean }
): Promise<WelcomeCouponCheckoutResult> {
  const lineUserId = identity.lineUserId?.trim();
  if (!lineUserId) {
    return { valid: false, reason: "not_connected" };
  }

  const supabase = createAdminSupabaseClient();
  let coupon = await findCouponByLineUserId(supabase, lineUserId);

  if (!coupon && options?.ensure) {
    const ensured = await ensureWelcomeCouponForLineUser({ lineUserId });
    coupon = ensured.coupon;
  }

  if (!coupon) {
    return { valid: false, reason: "unavailable" };
  }

  const validation = await validateCustomerCouponForOrder(coupon.code, identity);
  if (!validation.valid) {
    return { valid: false, reason: "unavailable" };
  }

  return {
    valid: true,
    code: validation.code.code,
    discountValue: validation.code.discountValue
  };
}
