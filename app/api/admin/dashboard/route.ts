import { fetchDashboardStatsFromDb } from "@/lib/db/orders";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { stats, orders } = await fetchDashboardStatsFromDb();
    return NextResponse.json({ stats, orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load dashboard";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
