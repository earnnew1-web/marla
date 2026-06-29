import { linkLineToOrderByCode } from "@/lib/db/orders";
import { sendLineStatusNotificationForOrder } from "@/lib/line/send-status";
import { sendWelcomeCouponMessage } from "@/lib/line/send-welcome";
import { serializeApiError } from "@/lib/supabase/errors";
import { NextResponse } from "next/server";

type LinkLineBody = {
  orderCode?: string;
  lineUserId?: string;
  lineDisplayName?: string;
  linePictureUrl?: string;
};

export async function POST(request: Request) {
  try {
    let body: LinkLineBody;
    try {
      body = (await request.json()) as LinkLineBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const orderCode = body.orderCode?.trim();
    const lineUserId = body.lineUserId?.trim();

    if (!orderCode || !lineUserId) {
      return NextResponse.json(
        { error: "orderCode and lineUserId are required" },
        { status: 400 }
      );
    }

    const { order, isFirstConnect, welcomeCouponCode } = await linkLineToOrderByCode(orderCode, {
      userId: lineUserId,
      displayName: body.lineDisplayName?.trim() || lineUserId,
      pictureUrl: body.linePictureUrl?.trim() || null
    });

    if (isFirstConnect && welcomeCouponCode) {
      await sendWelcomeCouponMessage(lineUserId, welcomeCouponCode);
    }

    await sendLineStatusNotificationForOrder(order.id);

    return NextResponse.json({ success: true, order, welcomeCouponCode: welcomeCouponCode ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to link LINE";
    if (message === "Order not found") {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    const payload = serializeApiError(error);
    console.error("[POST /api/orders/link-line] failed", payload);
    return NextResponse.json(payload, { status: 500 });
  }
}
