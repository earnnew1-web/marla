import { fetchOrdersForAdmin } from "@/lib/db/orders";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const orders = await fetchOrdersForAdmin();
    return NextResponse.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load orders";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
