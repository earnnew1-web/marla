import { fetchOrderByCodeAndPhone } from "@/lib/db/orders";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code") ?? "";
    const phone = searchParams.get("phone") ?? "";

    if (!code.trim() || !phone.trim()) {
      return NextResponse.json({ error: "Order code and phone are required" }, { status: 400 });
    }

    const order = await fetchOrderByCodeAndPhone(code.trim(), phone.trim());
    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to track order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
