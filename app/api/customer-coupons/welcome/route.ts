import { resolveWelcomeCouponForCheckout } from "@/lib/db/customer-coupons";
import { serializeApiError } from "@/lib/supabase/errors";
import { NextResponse } from "next/server";

type WelcomeCouponBody = {
  lineUserId?: string | null;
  phone?: string | null;
  email?: string | null;
  ensure?: boolean;
};

export async function POST(request: Request) {
  try {
    let body: WelcomeCouponBody;
    try {
      body = (await request.json()) as WelcomeCouponBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const result = await resolveWelcomeCouponForCheckout(
      {
        lineUserId: body.lineUserId,
        phone: body.phone,
        email: body.email
      },
      { ensure: body.ensure === true }
    );

    return NextResponse.json(result);
  } catch (error) {
    const payload = serializeApiError(error);
    console.error("[POST /api/customer-coupons/welcome] failed", payload);
    return NextResponse.json(payload, { status: 500 });
  }
}
