import { createOrderInDb } from "@/lib/db/orders";
import { serializeApiError } from "@/lib/supabase/errors";
import type { DraftOrder } from "@/lib/types";
import { NextResponse } from "next/server";

function isClientOrderError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("discount") ||
    message.includes("coupon") ||
    message.includes("required") ||
    message.includes("missing") ||
    message.includes("invalid") ||
    message.includes("slip")
  );
}

export async function POST(request: Request) {
  try {
    let body: DraftOrder;
    try {
      body = (await request.json()) as DraftOrder;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const order = await createOrderInDb(body);
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    const payload = serializeApiError(error);
    const status = isClientOrderError(error) ? 400 : 500;
    console.error("[POST /api/orders] failed", payload);
    return NextResponse.json(payload, { status });
  }
}
