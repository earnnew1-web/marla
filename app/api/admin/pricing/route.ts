import { fetchPricingFromDb, savePricingToDb } from "@/lib/db/orders";
import type { PricingSettings } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const pricing = await fetchPricingFromDb();
    return NextResponse.json({ pricing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load pricing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as PricingSettings;
    const pricing = await savePricingToDb(body);
    return NextResponse.json({ pricing });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save pricing";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
