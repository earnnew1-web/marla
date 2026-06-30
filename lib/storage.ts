"use client";

import { emptyRoll, normalizeRolls } from "@/lib/film-roll";
import { mockOrders } from "@/lib/mock-data";
import { formatOrderCode, nextOrderCodeSequence } from "@/lib/order-code";
import { defaultPricing, priceRoll, priceTotal } from "@/lib/pricing";
import { customerLineLabel } from "@/lib/line/customer-fields";
import type { DraftOrder, Order, OrderStatus, PaymentInfo, PricingSettings } from "@/lib/types";

const draftKey = "mfl:draft-order";
const slipKey = "mfl:payment-slip";
const ordersKey = "mfl:orders";
const pricingKey = "mfl:pricing";
const adminSessionKey = "mfl:admin-session";

export { emptyRoll };

export const emptyDraft = (): DraftOrder => ({ rolls: [emptyRoll()] });

type StoredSlip = Pick<PaymentInfo, "paymentSlipDataUrl" | "paymentSlipFileName">;

function readPaymentSlip(): StoredSlip | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(slipKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSlip;
  } catch {
    sessionStorage.removeItem(slipKey);
    return null;
  }
}

function writePaymentSlip(slip: StoredSlip | null) {
  if (typeof window === "undefined") return;
  if (!slip?.paymentSlipDataUrl) {
    sessionStorage.removeItem(slipKey);
    return;
  }
  sessionStorage.setItem(slipKey, JSON.stringify(slip));
}

function mergePaymentSlip(draft: DraftOrder): DraftOrder {
  const slip = readPaymentSlip();
  if (!slip?.paymentSlipDataUrl) return draft;
  return {
    ...draft,
    payment: {
      ...draft.payment,
      method: draft.payment?.method ?? "bank_transfer",
      ...slip
    }
  };
}

function stripSlipForStorage(draft: DraftOrder): DraftOrder {
  if (!draft.payment?.paymentSlipDataUrl) return draft;
  const { paymentSlipDataUrl, paymentSlipFileName, ...paymentRest } = draft.payment;
  writePaymentSlip({ paymentSlipDataUrl, paymentSlipFileName });
  return {
    ...draft,
    payment: Object.keys(paymentRest).length ? paymentRest : undefined
  };
}

export function loadDraft(): DraftOrder {
  if (typeof window === "undefined") return emptyDraft();

  const raw = localStorage.getItem(draftKey);
  if (!raw) return emptyDraft();

  try {
    const parsed = JSON.parse(raw) as DraftOrder;
    return mergePaymentSlip({
      ...parsed,
      rolls: normalizeRolls(parsed.rolls ?? [])
    });
  } catch {
    localStorage.removeItem(draftKey);
    return emptyDraft();
  }
}

export function saveDraft(draft: DraftOrder) {
  localStorage.setItem(draftKey, JSON.stringify(stripSlipForStorage(draft)));
}

export function clearDraft() {
  localStorage.removeItem(draftKey);
  writePaymentSlip(null);
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
  const nextNumber = nextOrderCodeSequence(orders.map((order) => order.orderCode));
  const pricing = loadPricing();
  const rolls = draft.rolls.map((roll) => ({ ...roll, price: priceRoll(roll, pricing) }));
  const wantsDelivery = draft.delivery.filmReturn === "Delivery (+60 THB)";
  const initialStatus: OrderStatus =
    draft.payment.method === "cash" ? "Pending Payment Confirmation" : "Received";

  const order: Order = {
    id: crypto.randomUUID(),
    orderCode: formatOrderCode(nextNumber),
    customer: {
      id: crypto.randomUUID(),
      ...draft.customer,
      lineId: customerLineLabel(draft.customer) ?? "",
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
