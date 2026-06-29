import type { DiscountErrorCode } from "@/lib/discount-errors";
import type { DraftOrder, Order } from "@/lib/types";

async function parseJson<T>(response: Response): Promise<T> {
  let payload: T & { error?: string; details?: string | null };
  try {
    payload = (await response.json()) as T & { error?: string; details?: string | null };
  } catch {
    throw new Error(`Request failed (${response.status})`);
  }

  if (!response.ok) {
    const message = [payload.error, payload.details].filter(Boolean).join(" — ");
    throw new Error(message || `Request failed (${response.status})`);
  }

  return payload;
}

export async function fetchOrderByCode(code: string) {
  const params = new URLSearchParams({ code: code.trim() });
  const response = await fetch(`/api/orders/by-code?${params.toString()}`, { cache: "no-store" });
  return parseJson<{ order: Order | null }>(response);
}

export async function trackOrderByCodeAndPhone(code: string, phone: string) {
  const params = new URLSearchParams({ code: code.trim(), phone: phone.trim() });
  const response = await fetch(`/api/orders/track?${params.toString()}`, { cache: "no-store" });
  const payload = await parseJson<{ order: Order | null }>(response);
  return payload;
}

export async function submitOrder(draft: DraftOrder) {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft)
  });
  const payload = await parseJson<{ order: Order }>(response);
  return payload;
}

export async function linkLineToOrder(input: {
  orderCode: string;
  lineUserId: string;
  lineDisplayName?: string;
  linePictureUrl?: string | null;
}) {
  const response = await fetch("/api/orders/link-line", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  return parseJson<{ success: boolean; order: Order }>(response);
}

export async function validateDiscountCode(input: {
  code: string;
  lineUserId?: string | null;
  phone?: string | null;
  email?: string | null;
}) {
  const response = await fetch("/api/discount-codes/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  const payload = (await response.json()) as {
    valid?: boolean;
    code?: string;
    discountValue?: number;
    error?: string;
    errorCode?: DiscountErrorCode;
    details?: string | null;
  };

  if (!response.ok || !payload.valid) {
    return {
      valid: false as const,
      error: payload.error ?? "Invalid discount code",
      errorCode: payload.errorCode ?? "invalid"
    };
  }

  if (!payload.code || !payload.discountValue) {
    return {
      valid: false as const,
      error: payload.error ?? "Invalid discount code",
      errorCode: payload.errorCode ?? "invalid"
    };
  }

  return {
    valid: true as const,
    code: payload.code,
    discountValue: payload.discountValue
  };
}

export type WelcomeCouponResponse =
  | { valid: true; code: string; discountValue: number }
  | { valid: false; reason: "not_connected" | "unavailable" };

export async function fetchWelcomeCoupon(input: {
  lineUserId?: string | null;
  phone?: string | null;
  email?: string | null;
  ensure?: boolean;
}) {
  const response = await fetch("/api/customer-coupons/welcome", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  const payload = (await response.json()) as WelcomeCouponResponse & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not load welcome coupon");
  }

  return payload;
}

export async function fetchWelcomePromoEligibility(input: {
  lineUserId?: string | null;
  phone?: string | null;
  email?: string | null;
}) {
  const response = await fetch("/api/customer-coupons/eligibility", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  const payload = (await response.json()) as { eligible?: boolean; error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not check welcome promo eligibility");
  }

  return { eligible: payload.eligible === true };
}
