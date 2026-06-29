import { checkWelcomePromoEligibility } from "@/lib/db/customer-coupons";
import { serializeApiError } from "@/lib/supabase/errors";
import { NextResponse } from "next/server";

type EligibilityBody = {
  lineUserId?: string | null;
  phone?: string | null;
  email?: string | null;
};

export async function POST(request: Request) {
  try {
    let body: EligibilityBody;
    try {
      body = (await request.json()) as EligibilityBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const result = await checkWelcomePromoEligibility({
      lineUserId: body.lineUserId,
      phone: body.phone,
      email: body.email
    });

    return NextResponse.json(result);
  } catch (error) {
    const payload = serializeApiError(error);
    console.error("[POST /api/customer-coupons/eligibility] failed", payload);
    return NextResponse.json(payload, { status: 500 });
  }
}
