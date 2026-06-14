import { toast } from "sonner";
import type { OrderStatus } from "@/lib/types";

export type LineNotificationResult = {
  sent: boolean;
  linked: boolean;
  skipped?: boolean;
  reason?: string;
};

export async function sendAdminLineStatusNotification(orderId: string, status: OrderStatus) {
  const response = await fetch("/api/line/send-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order_id: orderId, status })
  });

  const payload = (await response.json()) as LineNotificationResult & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to send LINE notification");
  }

  return payload;
}

export function toastLineNotificationResult(result: LineNotificationResult) {
  if (
    result.skipped ||
    result.reason === "Unsupported status for LINE notification" ||
    result.reason === "LINE messaging is not configured"
  ) {
    return;
  }

  if (!result.linked) {
    toast.message("No LINE user linked");
    return;
  }

  if (result.sent) {
    toast.success("LINE notification sent");
    return;
  }

  toast.error(result.reason ?? "Could not send LINE notification");
}

export async function notifyAdminLineStatus(orderId: string, status: OrderStatus) {
  try {
    const result = await sendAdminLineStatusNotification(orderId, status);
    toastLineNotificationResult(result);
    return result;
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Failed to send LINE notification");
    return null;
  }
}
