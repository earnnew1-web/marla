import {
  fetchDiscountCodesFromDb,
  generateFirstOrderDiscountCode,
  setDiscountCodeActive
} from "@/lib/db/discount-codes";
import { serializeApiError } from "@/lib/supabase/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const codes = await fetchDiscountCodesFromDb();
    return NextResponse.json({ codes });
  } catch (error) {
    const payload = serializeApiError(error);
    console.error("[GET /api/admin/discount-codes] failed", payload);
    return NextResponse.json(payload, { status: 500 });
  }
}

export async function POST() {
  try {
    const code = await generateFirstOrderDiscountCode();
    return NextResponse.json({ code }, { status: 201 });
  } catch (error) {
    const payload = serializeApiError(error);
    console.error("[POST /api/admin/discount-codes] failed", payload);
    return NextResponse.json(payload, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    let body: { id?: string; active?: boolean };
    try {
      body = (await request.json()) as { id?: string; active?: boolean };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.id || typeof body.active !== "boolean") {
      return NextResponse.json({ error: "id and active are required" }, { status: 400 });
    }

    const code = await setDiscountCodeActive(body.id, body.active);
    return NextResponse.json({ code });
  } catch (error) {
    const payload = serializeApiError(error);
    console.error("[PATCH /api/admin/discount-codes] failed", payload);
    return NextResponse.json(payload, { status: 500 });
  }
}
