import {
  confirmOrderInDb,
  confirmOrderPaymentInDb,
  fetchOrderByIdForAdmin,
  updateOrderStatusInDb
} from "@/lib/db/orders";
import { normalizeStatus } from "@/lib/db/mappers";
import { orderStatuses } from "@/lib/options";
import { serializeApiError } from "@/lib/supabase/errors";
import type { OrderStatus } from "@/lib/types";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const order = await fetchOrderByIdForAdmin(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    const payload = serializeApiError(error);
    console.error("[GET /api/admin/orders/[id]] failed", { id, ...payload, error });
    return NextResponse.json(payload, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    let body: { status?: unknown; confirmPayment?: unknown; confirmOrder?: unknown };
    try {
      body = (await request.json()) as {
        status?: unknown;
        confirmPayment?: unknown;
        confirmOrder?: unknown;
      };
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (body.confirmPayment === true) {
      const order = await confirmOrderPaymentInDb(id);
      return NextResponse.json({ success: true, order });
    }

    if (body.confirmOrder === true) {
      const order = await confirmOrderInDb(id);
      return NextResponse.json({ success: true, order });
    }

    const rawStatus = body.status;
    if (typeof rawStatus !== "string" || !rawStatus.trim()) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid body. Expected { status: string }, { confirmPayment: true }, or { confirmOrder: true }."
        },
        { status: 400 }
      );
    }

    const status = normalizeStatus(rawStatus.trim()) as OrderStatus;
    if (!orderStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status "${rawStatus}". Allowed values: ${orderStatuses.join(", ")}`
        },
        { status: 400 }
      );
    }

    const order = await updateOrderStatusInDb(id, status);
    return NextResponse.json({ success: true, order });
  } catch (error) {
    const payload = serializeApiError(error);
    console.error("[PATCH /api/admin/orders/[id]] failed", { id, ...payload, error });
    return NextResponse.json({ success: false, error: payload.error }, { status: 500 });
  }
}
