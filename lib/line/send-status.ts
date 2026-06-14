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

export async function sendLineStatusMessage(
  orderId: string,
  status: OrderStatus | LineStatusKey | string
): Promise<LineSendResult> {
  if (!hasLineMessagingConfigured()) {
    return { sent: false, linked: false, skipped: true, reason: "LINE messaging is not configured" };
  }

  const statusKey = typeof status === "string" ? parseLineStatusInput(status) : parseLineStatusInput(status);
  if (!statusKey) {
    return { sent: false, linked: false, reason: "Unsupported status for LINE notification" };
  }

  const row = await fetchOrderForLineNotification(orderId);
  if (!row) {
    return { sent: false, linked: false, reason: "Order not found" };
  }

  const lineUserId = row.customer?.line_user_id?.trim();
  if (!lineUserId) {
    return { sent: false, linked: false, reason: "No LINE user linked" };
  }

  const flexMessage = buildOrderStatusFlexMessage(statusKey, {
    orderCode: row.order_code,
    totalPrice: row.total_price,
    customerPhone: row.customer?.phone ?? ""
  });

  await pushLineFlexMessage(lineUserId, flexMessage);
  return { sent: true, linked: true };
}

export async function sendLineOrderReceivedMessage(orderId: string) {
  return sendLineStatusMessage(orderId, "order_received");
}
