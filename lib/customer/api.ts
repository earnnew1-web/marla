import type { DraftOrder, Order } from "@/lib/types";

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string; details?: string | null };
  if (!response.ok) {
    const message = [payload.error, payload.details].filter(Boolean).join(" — ");
    throw new Error(message || "Request failed");
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
