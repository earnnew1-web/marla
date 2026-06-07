"use client";

import { emptyRoll, normalizeRolls } from "@/lib/film-roll";
import { mockOrders } from "@/lib/mock-data";
import { defaultPricing, priceRoll, priceTotal } from "@/lib/pricing";
import type { DraftOrder, Order, OrderStatus, PricingSettings } from "@/lib/types";

const draftKey = "mfl:draft-order";
const ordersKey = "mfl:orders";
const pricingKey = "mfl:pricing";
const adminSessionKey = "mfl:admin-session";

export { emptyRoll };

export const emptyDraft = (): DraftOrder => ({ rolls: [emptyRoll()] });

export function loadDraft(): DraftOrder {
  const raw = localStorage.getItem(draftKey);
  if (!raw) return emptyDraft();
  const parsed = JSON.parse(raw) as DraftOrder;
  return {
    ...parsed,
    rolls: normalizeRolls(parsed.rolls ?? [])
  };
}

export function saveDraft(draft: DraftOrder) {
  localStorage.setItem(draftKey, JSON.stringify(draft));
}

export function clearDraft() {
  localStorage.removeItem(draftKey);
}

export function loadPricing(): PricingSettings {
  const raw = localStorage.getItem(pricingKey);
  return raw ? (JSON.parse(raw) as PricingSettings) : defaultPricing;
}

export function savePricing(pricing: PricingSettings) {
  localStorage.setItem(pricingKey, JSON.stringify(pricing));
}

export function loadOrders(): Order[] {
  const raw = localStorage.getItem(ordersKey);
  if (raw) return JSON.parse(raw) as Order[];
  localStorage.setItem(ordersKey, JSON.stringify(mockOrders));
  return mockOrders;
}

export function saveOrders(orders: Order[]) {
  localStorage.setItem(ordersKey, JSON.stringify(orders));
}

export function submitDraftOrder(draft: DraftOrder): Order {
  if (!draft.customer || !draft.delivery || !draft.payment || draft.rolls.length === 0) {
    throw new Error("Order is missing required information.");
  }

  if (draft.payment.method === "bank_transfer" && !draft.payment.paymentSlipDataUrl) {
    throw new Error("Payment slip is required.");
  }

  const orders = loadOrders();
  const nextNumber = orders.reduce((max, order) => {
    const number = Number(order.orderCode.replace("MFL-", ""));
    return Number.isFinite(number) ? Math.max(max, number) : max;
  }, 1025) + 1;
  const pricing = loadPricing();
  const rolls = draft.rolls.map((roll) => ({ ...roll, price: priceRoll(roll, pricing) }));
  const wantsDelivery = draft.delivery.filmReturn === "Delivery (+60 THB)";
  const initialStatus: OrderStatus =
    draft.payment.method === "cash" ? "Pending Payment Confirmation" : "Received";

  const order: Order = {
    id: crypto.randomUUID(),
    orderCode: `MFL-${nextNumber}`,
    customer: {
      id: crypto.randomUUID(),
      ...draft.customer,
      createdAt: new Date().toISOString()
    },
    rolls,
    delivery: draft.delivery,
    payment: draft.payment,
    status: initialStatus,
    totalPrice: priceTotal(rolls, wantsDelivery, pricing),
    createdAt: new Date().toISOString(),
    filmDeliveryMethod: draft.filmDeliveryMethod ?? "drop_off"
  };

  saveOrders([order, ...orders]);
  localStorage.setItem("mfl:last-order-code", order.orderCode);
  clearDraft();
  return order;
}

export function confirmOrderPayment(orderId: string) {
  return updateOrderStatus(orderId, "Received");
}

export function getLastOrderCode() {
  return localStorage.getItem("mfl:last-order-code");
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  const orders = loadOrders().map((order) => (order.id === orderId ? { ...order, status } : order));
  saveOrders(orders);
  return orders.find((order) => order.id === orderId);
}

export function isAdminLoggedIn() {
  return localStorage.getItem(adminSessionKey) === "true";
}

export function loginAdmin(email: string, password: string) {
  const ok = email === "admin@marlafilmlab.com" && password === "admin123";
  if (ok) localStorage.setItem(adminSessionKey, "true");
  return ok;
}

export function logoutAdmin() {
  localStorage.removeItem(adminSessionKey);
}
