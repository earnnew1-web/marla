import { fetchOrderByCodeFromDb } from "@/lib/db/orders";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code") ?? "";

    if (!code.trim()) {
      return NextResponse.json({ error: "Order code is required" }, { status: 400 });
    }

    const order = await fetchOrderByCodeFromDb(code.trim());
    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
