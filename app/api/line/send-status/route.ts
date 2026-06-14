import { sendLineStatusNotificationForOrder } from "@/lib/line/send-status";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    let body: { orderId?: string; order_id?: string };
    try {
      body = (await request.json()) as { orderId?: string; order_id?: string };
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const orderId = body.orderId?.trim() || body.order_id?.trim();
    if (!orderId) {
      return NextResponse.json({ success: false, error: "orderId is required" }, { status: 400 });
    }

    const result = await sendLineStatusNotificationForOrder(orderId);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send LINE message";
    console.error("[POST /api/line/send-status] failed", message);
    return NextResponse.json(
      { success: false, error: message, sent: false, linked: false },
      { status: 500 }
    );
  }
}
