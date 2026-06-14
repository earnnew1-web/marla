import { sendLineStatusMessage } from "@/lib/line/send-status";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    let body: { order_id?: string; status?: string };
    try {
      body = (await request.json()) as { order_id?: string; status?: string };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const orderId = body.order_id?.trim();
    const status = body.status?.trim();

    if (!orderId || !status) {
      return NextResponse.json({ error: "order_id and status are required" }, { status: 400 });
    }

    const result = await sendLineStatusMessage(orderId, status);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send LINE message";
    console.error("[POST /api/line/send-status] failed", message);
    return NextResponse.json({ error: message, sent: false, linked: false }, { status: 500 });
  }
}
