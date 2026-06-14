import { pushLineFlexMessage } from "@/lib/line/client";
import { buildOrderStatusFlexMessage } from "@/lib/line/flex-messages";
import { hasLineMessagingConfigured } from "@/lib/line/env";
import { parseLineStatusInput, type LineStatusKey } from "@/lib/line/status";
import { TABLES } from "@/lib/config/tables";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

export type LineSendResult = {
  sent: boolean;
  linked: boolean;
  skipped?: boolean;
  reason?: string;
};

type OrderNotificationRow = {
  id: string;
  order_code: string;
  total_price: number;
  customer: {
    phone: string;
    line_user_id: string | null;
    line_connected: boolean | null;
  } | null;
};

async function fetchOrderForLineNotification(orderId: string): Promise<OrderNotificationRow | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.orders)
    .select(
      `id, order_code, total_price, customer:${TABLES.customers}(phone, line_user_id, line_connected)`
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const customer = Array.isArray(data.customer) ? data.customer[0] : data.customer;
  return {
    id: data.id,
    order_code: data.order_code,
    total_price: data.total_price,
    customer: customer ?? null
  };
}

function logLineSkip(reason: string, context: Record<string, unknown> = {}) {
  console.warn("[LINE] notification skipped:", reason, context);
}

function logLineFailure(error: unknown, context: Record<string, unknown> = {}) {
  console.error("[LINE] notification failed:", error, context);
}

export async function sendLineStatusMessage(
  orderId: string,
  status: OrderStatus | LineStatusKey | string
): Promise<LineSendResult> {
  if (!hasLineMessagingConfigured()) {
    logLineSkip("LINE messaging is not configured", { orderId });
    return { sent: false, linked: false, skipped: true, reason: "LINE messaging is not configured" };
  }

  const statusKey = typeof status === "string" ? parseLineStatusInput(status) : parseLineStatusInput(status);
  if (!statusKey) {
    logLineSkip("Unsupported status for LINE notification", { orderId, status });
    return { sent: false, linked: false, reason: "Unsupported status for LINE notification" };
  }

  const row = await fetchOrderForLineNotification(orderId);
  if (!row) {
    logLineSkip("Order not found", { orderId });
    return { sent: false, linked: false, reason: "Order not found" };
  }

  const lineUserId = row.customer?.line_user_id?.trim();
  if (!lineUserId) {
    logLineSkip("No LINE user linked", {
      orderId,
      orderCode: row.order_code,
      lineConnected: row.customer?.line_connected ?? false
    });
    return { sent: false, linked: false, reason: "No LINE user linked" };
  }

  try {
    const flexMessage = buildOrderStatusFlexMessage(statusKey, {
      orderCode: row.order_code,
      totalPrice: row.total_price,
      customerPhone: row.customer?.phone ?? ""
    });

    await pushLineFlexMessage(lineUserId, flexMessage);
    console.info("[LINE] notification sent", { orderId, orderCode: row.order_code, status: statusKey });
    return { sent: true, linked: true };
  } catch (error) {
    logLineFailure(error, { orderId, orderCode: row.order_code, status: statusKey });
    throw error;
  }
}

type OrderReceivedContext = {
  orderId: string;
  orderCode: string;
  totalPrice: number;
  customerPhone: string;
  lineUserId: string | null | undefined;
};

export async function sendLineOrderReceivedMessage(orderId: string) {
  return sendLineStatusMessage(orderId, "order_received");
}

/** Send order_received using data already written to the DB (avoids serverless fire-and-forget drops). */
export async function sendLineOrderReceivedFromContext(context: OrderReceivedContext): Promise<LineSendResult> {
  if (!hasLineMessagingConfigured()) {
    logLineSkip("LINE messaging is not configured", { orderId: context.orderId });
    return { sent: false, linked: false, skipped: true, reason: "LINE messaging is not configured" };
  }

  const lineUserId = context.lineUserId?.trim();
  if (!lineUserId) {
    logLineSkip("No LINE user linked", {
      orderId: context.orderId,
      orderCode: context.orderCode
    });
    return { sent: false, linked: false, reason: "No LINE user linked" };
  }

  try {
    const flexMessage = buildOrderStatusFlexMessage("order_received", {
      orderCode: context.orderCode,
      totalPrice: context.totalPrice,
      customerPhone: context.customerPhone
    });

    await pushLineFlexMessage(lineUserId, flexMessage);
    console.info("[LINE] order_received sent", {
      orderId: context.orderId,
      orderCode: context.orderCode
    });
    return { sent: true, linked: true };
  } catch (error) {
    logLineFailure(error, {
      orderId: context.orderId,
      orderCode: context.orderCode,
      status: "order_received"
    });
    return {
      sent: false,
      linked: true,
      reason: error instanceof Error ? error.message : "LINE API request failed"
    };
  }
}
