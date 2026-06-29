import { sendLinePushMessage } from "@/lib/line/client";
import { buildWelcomeCouponFlex } from "@/lib/line/flexMessages";
import { hasLineMessagingConfigured } from "@/lib/line/env";
import type { LineSendResult } from "@/lib/line/send-status";

export async function sendWelcomeCouponMessage(
  lineUserId: string,
  couponCode: string
): Promise<LineSendResult> {
  if (!hasLineMessagingConfigured()) {
    console.warn("[LINE] welcome coupon skipped: messaging is not configured");
    return {
      success: true,
      sent: false,
      linked: false,
      skipped: true,
      reason: "LINE messaging is not configured"
    };
  }

  const trimmedUserId = lineUserId.trim();
  if (!trimmedUserId) {
    return {
      success: false,
      sent: false,
      linked: false,
      reason: "No LINE user linked"
    };
  }

  try {
    const flexMessage = buildWelcomeCouponFlex(couponCode);
    await sendLinePushMessage(trimmedUserId, flexMessage);
    console.info("[LINE] welcome coupon sent", { lineUserId: trimmedUserId, couponCode });
    return { success: true, sent: true, linked: true };
  } catch (error) {
    console.error("[LINE] welcome coupon failed", error, { lineUserId: trimmedUserId, couponCode });
    return {
      success: false,
      sent: false,
      linked: true,
      reason: error instanceof Error ? error.message : "LINE API request failed"
    };
  }
}
