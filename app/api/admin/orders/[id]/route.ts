import {
  confirmOrderInDb,
  confirmOrderPaymentInDb,
  fetchOrderByIdForAdmin,
  updateOrderStatusInDb
} from "@/lib/db/orders";
import { normalizeStatus } from "@/lib/db/mappers";
import { isValidScanDriveUrl, orderRequiresScanDriveUrl } from "@/lib/order-scan";
import { orderStatuses } from "@/lib/options";
import { serializeApiError } from "@/lib/supabase/errors";
import type { OrderStatus } from "@/lib/types";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

type PatchBody = {
  status?: unknown;
  scanDriveUrl?: unknown;
  confirmPayment?: unknown;
  confirmOrder?: unknown;
};

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
    let body: PatchBody;
    try {
      body = (await request.json()) as PatchBody;
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

    const existing = await fetchOrderByIdForAdmin(id);
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const rawStatus = typeof body.status === "string" ? body.status.trim() : "";
    const hasStatus = Boolean(rawStatus);
    const rawScanDriveUrl = typeof body.scanDriveUrl === "string" ? body.scanDriveUrl.trim() : undefined;
    const hasScanDriveUrl = rawScanDriveUrl !== undefined;

    if (!hasStatus && !hasScanDriveUrl) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid body. Expected { status: string }, { scanDriveUrl: string }, { confirmPayment: true }, or { confirmOrder: true }."
        },
        { status: 400 }
      );
    }

    if (hasScanDriveUrl && rawScanDriveUrl && !isValidScanDriveUrl(rawScanDriveUrl)) {
      return NextResponse.json({ error: "Please enter a valid Google Drive URL." }, { status: 400 });
    }

    if (hasStatus) {
      const status = normalizeStatus(rawStatus) as OrderStatus;
      if (!orderStatuses.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status "${rawStatus}". Allowed values: ${orderStatuses.join(", ")}`
          },
          { status: 400 }
        );
      }

      if (status === "Ready" && orderRequiresScanDriveUrl(existing)) {
        const nextUrl = rawScanDriveUrl ?? existing.scanDriveUrl ?? "";
        if (!isValidScanDriveUrl(nextUrl)) {
          return NextResponse.json(
            { error: "Google Drive URL is required for scan orders when marking Ready." },
            { status: 400 }
          );
        }

        const order = await updateOrderStatusInDb(id, status, { scanDriveUrl: nextUrl });
        return NextResponse.json({ success: true, order });
      }

      const order = await updateOrderStatusInDb(
        id,
        status,
        hasScanDriveUrl ? { scanDriveUrl: rawScanDriveUrl || null } : undefined
      );
      return NextResponse.json({ success: true, order });
    }

    if (!rawScanDriveUrl || !isValidScanDriveUrl(rawScanDriveUrl)) {
      return NextResponse.json({ error: "Please enter a valid Google Drive URL." }, { status: 400 });
    }

    const order = await updateOrderStatusInDb(id, existing.status, { scanDriveUrl: rawScanDriveUrl });
    return NextResponse.json({ success: true, order });
  } catch (error) {
    const payload = serializeApiError(error);
    console.error("[PATCH /api/admin/orders/[id]] failed", { id, ...payload, error });
    return NextResponse.json({ success: false, error: payload.error }, { status: 500 });
  }
}
