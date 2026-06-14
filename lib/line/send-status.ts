import { normalizeStatusValue } from "@/lib/admin/status-styles";
import { sendLinePushMessage } from "@/lib/line/client";
import { buildOrderStatusFlex } from "@/lib/line/flexMessages";
import { hasLineMessagingConfigured } from "@/lib/line/env";
import { orderStatusToLineKey, parseLineStatusInput, resolveSubmitLineStatusKey, type LineStatusKey } from "@/lib/line/status";
import { TABLES } from "@/lib/config/tables";
import { createAdminSupabaseClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/types";

export type LineSendResult = {
  success: boolean;
  sent: boolean;
  linked: boolean;
  skipped?: boolean;
  reason?: string;
};

type OrderNotificationRow = {
  id: string;
  order_code: string;
  total_price: number;
  status: string;
  scan_drive_url?: string | null;
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
      `id, order_code, total_price, status, scan_drive_url, customer:${TABLES.customers}(phone, line_user_id, line_connected)`
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
    status: data.status,
    scan_drive_url: data.scan_drive_url ?? null,
    customer: customer ?? null
  };
}

function logLineSkip(reason: string, context: Record<string, unknown> = {}) {
  console.warn("[LINE] notification skipped:", reason, context);
}

function logLineFailure(error: unknown, context: Record<string, unknown> = {}) {
  console.error("[LINE] notification failed:", error, context);
}

function successResult(result: Omit<LineSendResult, "success">): LineSendResult {
  return { success: true, ...result };
}

function resolveStatusKey(
  row: OrderNotificationRow,
  explicitStatus?: OrderStatus | LineStatusKey | string
): LineStatusKey | null {
  if (explicitStatus !== undefined) {
    const parsedExplicit = parseLineStatusInput(String(explicitStatus));
    if (parsedExplicit) return parsedExplicit;
  }

  return orderStatusToLineKey(normalizeStatusValue(row.status));
}

async function sendFlexForOrder(
  row: OrderNotificationRow,
  statusKey: LineStatusKey
): Promise<LineSendResult> {
  const lineUserId = row.customer?.line_user_id?.trim();
  if (!lineUserId) {
    logLineSkip("No LINE user linked", {
      orderId: row.id,
      orderCode: row.order_code,
      lineConnected: row.customer?.line_connected ?? false
    });
    return successResult({ sent: false, linked: false, reason: "No LINE user linked" });
  }

  try {
    const flexMessage = buildOrderStatusFlex({
      orderCode: row.order_code,
      totalPrice: row.total_price,
      customerPhone: row.customer?.phone ?? "",
      statusKey,
      scanDriveUrl: row.scan_drive_url
    });

    await sendLinePushMessage(lineUserId, flexMessage);
    console.info("[LINE] notification sent", {
      orderId: row.id,
      orderCode: row.order_code,
      status: statusKey
    });
    return successResult({ sent: true, linked: true });
  } catch (error) {
    logLineFailure(error, { orderId: row.id, orderCode: row.order_code, status: statusKey });
    return {
      success: false,
      sent: false,
      linked: true,
      reason: error instanceof Error ? error.message : "LINE API request failed"
    };
  }
}

/** Primary entry: read current order status from DB and notify the linked LINE user. */
export async function sendLineStatusNotificationForOrder(orderId: string): Promise<LineSendResult> {
  if (!hasLineMessagingConfigured()) {
    logLineSkip("LINE messaging is not configured", { orderId });
    return successResult({
      sent: false,
      linked: false,
      skipped: true,
      reason: "LINE messaging is not configured"
    });
  }

  const row = await fetchOrderForLineNotification(orderId);
  if (!row) {
    logLineSkip("Order not found", { orderId });
    return { success: false, sent: false, linked: false, reason: "Order not found" };
  }

  const statusKey = resolveStatusKey(row);
  if (!statusKey) {
    logLineSkip("Unsupported status for LINE notification", { orderId, status: row.status });
    return successResult({
      sent: false,
      linked: Boolean(row.customer?.line_user_id?.trim()),
      skipped: true,
      reason: "Unsupported status for LINE notification"
    });
  }

  return sendFlexForOrder(row, statusKey);
}

export async function sendLineStatusMessage(
  orderId: string,
  status?: OrderStatus | LineStatusKey | string
): Promise<LineSendResult> {
  if (!hasLineMessagingConfigured()) {
    logLineSkip("LINE messaging is not configured", { orderId });
    return successResult({
      sent: false,
      linked: false,
      skipped: true,
      reason: "LINE messaging is not configured"
    });
  }

  const row = await fetchOrderForLineNotification(orderId);
  if (!row) {
    logLineSkip("Order not found", { orderId });
    return { success: false, sent: false, linked: false, reason: "Order not found" };
  }

  const statusKey = resolveStatusKey(row, status);
  if (!statusKey) {
    logLineSkip("Unsupported status for LINE notification", { orderId, status: status ?? row.status });
    return successResult({
      sent: false,
      linked: Boolean(row.customer?.line_user_id?.trim()),
      reason: "Unsupported status for LINE notification"
    });
  }

  return sendFlexForOrder(row, statusKey);
}

type OrderReceivedContext = {
  orderId: string;
  orderCode: string;
  totalPrice: number;
  customerPhone: string;
  lineUserId: string | null | undefined;
  orderStatus: OrderStatus;
};

export async function sendLineOrderReceivedMessage(orderId: string) {
  return sendLineStatusNotificationForOrder(orderId);
}

/** Send submit confirmation Flex using data already written to the DB. */
export async function sendLineOrderReceivedFromContext(context: OrderReceivedContext): Promise<LineSendResult> {
  if (!hasLineMessagingConfigured()) {
    logLineSkip("LINE messaging is not configured", { orderId: context.orderId });
    return successResult({
      sent: false,
      linked: false,
      skipped: true,
      reason: "LINE messaging is not configured"
    });
  }

  const lineUserId = context.lineUserId?.trim();
  if (!lineUserId) {
    logLineSkip("No LINE user linked", {
      orderId: context.orderId,
      orderCode: context.orderCode
    });
    return successResult({ sent: false, linked: false, reason: "No LINE user linked" });
  }

  const statusKey = resolveSubmitLineStatusKey(context.orderStatus);

  try {
    const flexMessage = buildOrderStatusFlex({
      orderCode: context.orderCode,
      totalPrice: context.totalPrice,
      customerPhone: context.customerPhone,
      statusKey
    });

    await sendLinePushMessage(lineUserId, flexMessage);
    console.info("[LINE] order submit notification sent", {
      orderId: context.orderId,
      orderCode: context.orderCode,
      status: statusKey
    });
    return successResult({ sent: true, linked: true });
  } catch (error) {
    logLineFailure(error, {
      orderId: context.orderId,
      orderCode: context.orderCode,
      status: statusKey
    });
    return {
      success: false,
      sent: false,
      linked: true,
      reason: error instanceof Error ? error.message : "LINE API request failed"
    };
  }
}
