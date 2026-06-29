import type { AdminCustomerRow, AdminDashboardStats, DiscountCode, Order, OrderStatus, PricingSettings } from "@/lib/types";

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & {
    error?: string;
    details?: string | null;
    code?: string | null;
  };
  if (!response.ok) {
    const message = [payload.error, payload.details].filter(Boolean).join(" — ");
    throw new Error(message || "Request failed");
  }
  return payload;
}

export async function fetchAdminOrders() {
  const response = await fetch("/api/admin/orders", { cache: "no-store" });
  return parseJson<{ orders: Order[] }>(response);
}

export async function fetchAdminOrder(id: string) {
  const response = await fetch(`/api/admin/orders/${id}`, { cache: "no-store" });
  return parseJson<{ order: Order }>(response);
}

export async function confirmAdminOrderPayment(id: string) {
  const response = await fetch(`/api/admin/orders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmPayment: true })
  });
  const payload = (await response.json()) as {
    success?: boolean;
    order?: Order;
    error?: string;
    details?: string | null;
  };
  if (!response.ok || payload.success === false) {
    const message = [payload.error, payload.details].filter(Boolean).join(" — ");
    throw new Error(message || "Request failed");
  }
  if (!payload.order) {
    throw new Error("Payment confirmed but no order was returned");
  }
  return { order: payload.order };
}

export async function confirmAdminOrder(id: string) {
  const response = await fetch(`/api/admin/orders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ confirmOrder: true })
  });
  const payload = (await response.json()) as {
    success?: boolean;
    order?: Order;
    error?: string;
    details?: string | null;
  };
  if (!response.ok || payload.success === false) {
    const message = [payload.error, payload.details].filter(Boolean).join(" — ");
    throw new Error(message || "Request failed");
  }
  if (!payload.order) {
    throw new Error("Order confirmed but no order was returned");
  }
  return { order: payload.order };
}

export async function patchAdminOrderStatus(
  id: string,
  requestBody: { status: OrderStatus; scanDriveUrl?: string }
) {
  const response = await fetch(`/api/admin/orders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });
  const payload = (await response.json()) as {
    success?: boolean;
    order?: Order;
    error?: string;
    details?: string | null;
  };
  if (!response.ok || payload.success === false) {
    const message = [payload.error, payload.details].filter(Boolean).join(" — ");
    throw new Error(message || "Request failed");
  }
  if (!payload.order) {
    throw new Error("Order update succeeded but no order was returned");
  }
  return { order: payload.order };
}

export async function fetchAdminDashboard() {
  const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
  return parseJson<{ stats: AdminDashboardStats; orders: Order[] }>(response);
}

export async function fetchAdminCustomers() {
  const response = await fetch("/api/admin/customers", { cache: "no-store" });
  return parseJson<{ customers: AdminCustomerRow[] }>(response);
}

export async function fetchAdminPricing() {
  const response = await fetch("/api/admin/pricing", { cache: "no-store" });
  return parseJson<{ pricing: PricingSettings }>(response);
}

export async function saveAdminPricing(pricing: PricingSettings) {
  const response = await fetch("/api/admin/pricing", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pricing)
  });
  return parseJson<{ pricing: PricingSettings }>(response);
}

export async function fetchAdminDiscountCodes() {
  const response = await fetch("/api/admin/discount-codes", { cache: "no-store" });
  return parseJson<{ codes: DiscountCode[] }>(response);
}

export async function generateAdminDiscountCode() {
  const response = await fetch("/api/admin/discount-codes", { method: "POST" });
  return parseJson<{ code: DiscountCode }>(response);
}

export async function setAdminDiscountCodeActive(id: string, active: boolean) {
  const response = await fetch("/api/admin/discount-codes", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, active })
  });
  return parseJson<{ code: DiscountCode }>(response);
}
