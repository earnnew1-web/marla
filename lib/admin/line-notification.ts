import { toast } from "sonner";

export type LineNotificationResult = {
  success?: boolean;
  sent: boolean;
  linked: boolean;
  skipped?: boolean;
  reason?: string;
};

export async function sendAdminLineStatusNotification(orderId: string): Promise<LineNotificationResult> {
  const response = await fetch("/api/line/send-status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId })
  });

  const payload = (await response.json()) as LineNotificationResult & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? payload.reason ?? "Failed to send LINE notification");
  }

  return payload;
}

export function toastLineTestResult(result: LineNotificationResult | null) {
  if (!result) {
    toast.error("LINE notification failed.");
    return;
  }

  if (result.sent) {
    toast.success("LINE notification sent");
    return;
  }

  if (!result.linked) {
    toast.message("No LINE user linked");
    return;
  }

  if (result.skipped) {
    toast.message(result.reason ?? "LINE notification skipped");
    return;
  }

  toast.error(result.reason ?? "LINE notification failed.");
}

export function toastStatusUpdateWithLine(result: LineNotificationResult | null) {
  if (!result) {
    toast.error("Status updated, but LINE notification failed.");
    return;
  }

  if (result.sent) {
    toast.success("Status updated and LINE notification sent");
    return;
  }

  if (
    result.skipped ||
    result.reason === "Unsupported status for LINE notification" ||
    result.reason === "LINE messaging is not configured"
  ) {
    toast.success("Status updated");
    return;
  }

  if (!result.linked) {
    toast.success("Status updated. No LINE linked.");
    return;
  }

  toast.error("Status updated, but LINE notification failed.");
}

export async function notifyAdminLineStatus(orderId: string): Promise<LineNotificationResult | null> {
  try {
    return await sendAdminLineStatusNotification(orderId);
  } catch (error) {
    console.error("[notifyAdminLineStatus]", error);
    return null;
  }
}
