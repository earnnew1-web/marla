import { validateDiscountCodeForOrder } from "@/lib/db/discount-codes";
import { serializeApiError } from "@/lib/supabase/errors";
import { NextResponse } from "next/server";

type ValidateBody = {
  code?: string;
  lineUserId?: string | null;
  phone?: string | null;
  email?: string | null;
};

export async function POST(request: Request) {
  try {
    let body: ValidateBody;
    try {
      body = (await request.json()) as ValidateBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const code = body.code?.trim();
    if (!code) {
      return NextResponse.json({ error: "Discount code is required" }, { status: 400 });
    }

    const result = await validateDiscountCodeForOrder(code, {
      lineUserId: body.lineUserId,
      phone: body.phone,
      email: body.email
    });

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error, errorCode: result.errorCode }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      code: result.code.code,
      discountValue: result.code.discountValue
    });
  } catch (error) {
    const payload = serializeApiError(error);
    console.error("[POST /api/discount-codes/validate] failed", payload);
    return NextResponse.json(payload, { status: 500 });
  }
}
