"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  confirmAdminOrder,
  confirmAdminOrderPayment,
  fetchAdminOrder
} from "@/lib/admin/api";
import {
  notifyAdminLineStatus,
  sendAdminLineStatusNotification,
  toastLineTestResult
} from "@/lib/admin/line-notification";
import {
  formatFilmDeliveryMethod,
  formatPaymentMethod,
  formatPaymentStatus,
  formatReturnMethod
} from "@/lib/admin/order-labels";
import { formatPushPullLabel, getRollBrandLabel, getRollStockLabel } from "@/lib/film-roll";
import { money, shortDate } from "@/lib/format";
import {
  LAB_ADDRESS_LINE,
  LAB_NAME,
  LAB_PHONE_DISPLAY
} from "@/lib/lab-address";
import type { Order } from "@/lib/types";

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<"payment" | "order" | null>(null);
  const [lineTestLoading, setLineTestLoading] = useState(false);

  useEffect(() => {
    fetchAdminOrder(params.id)
      .then(({ order: nextOrder }) => setOrder(nextOrder))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load order"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  const confirmPayment = async () => {
    if (!order) return;
    setActionLoading("payment");
    try {
      const { order: updated } = await confirmAdminOrderPayment(order.id);
      setOrder(updated);
      const lineResult = await notifyAdminLineStatus(updated.id);
      if (lineResult?.sent) {
        toast.success("Payment confirmed and LINE notification sent");
      } else if (lineResult && !lineResult.linked) {
        toast.success("Payment confirmed. No LINE linked.");
      } else {
        toast.success("Payment confirmed");
      }
      if (lineResult && lineResult.linked && !lineResult.sent && !lineResult.skipped) {
        toast.error("Payment confirmed, but LINE notification failed.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm payment");
    } finally {
      setActionLoading(null);
    }
  };

  const confirmOrder = async () => {
    if (!order) return;
    setActionLoading("order");
    try {
      const { order: updated } = await confirmAdminOrder(order.id);
      setOrder(updated);
      const lineResult = await notifyAdminLineStatus(updated.id);
      if (lineResult?.sent) {
        toast.success("Order confirmed and LINE notification sent");
      } else if (lineResult && !lineResult.linked) {
        toast.success("Order confirmed — status set to Received. No LINE linked.");
      } else {
        toast.success("Order confirmed — status set to Received");
      }
      if (lineResult && lineResult.linked && !lineResult.sent && !lineResult.skipped) {
        toast.error("Order confirmed, but LINE notification failed.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to confirm order");
    } finally {
      setActionLoading(null);
    }
  };

  const sendTestLine = async () => {
    if (!order) return;
    setLineTestLoading(true);
    try {
      const result = await sendAdminLineStatusNotification(order.id);
      toastLineTestResult(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "LINE notification failed.");
    } finally {
      setLineTestLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout>
        <Card>
          <CardContent className="p-5">{error || "Order not found."}</CardContent>
        </Card>
      </AdminLayout>
    );
  }

  const showConfirmOrder = order.status === "Pending Payment Confirmation";
  const showConfirmPayment = order.payment?.status !== "paid";

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Order detail</p>
          <h1 className="mt-2 text-3xl font-bold">{order.orderCode}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {shortDate(order.createdAt)}
            {order.updatedAt ? ` · Updated ${shortDate(order.updatedAt)}` : ""} · {money(order.totalPrice)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        {showConfirmPayment ? (
          <Button type="button" onClick={confirmPayment} disabled={actionLoading !== null}>
            {actionLoading === "payment" ? "Confirming..." : "Confirm Payment"}
          </Button>
        ) : null}
        {showConfirmOrder ? (
          <Button type="button" variant="outline" onClick={confirmOrder} disabled={actionLoading !== null}>
            {actionLoading === "order" ? "Confirming..." : "Confirm Order"}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardDescription className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Customer information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Info label="Full name" value={order.customer.name} />
                <Info label="Phone number" value={order.customer.phone} />
                <Info
                  label="LINE ID"
                  value={
                    order.customer.lineConnected
                      ? order.customer.lineId || order.customer.lineDisplayName || "Connected"
                      : order.customer.lineId || "—"
                  }
                />
                <Info label="Email" value={order.customer.email || "—"} />
                <Info label="Social media consent" value={order.customer.allowSocialShare ? "Yes" : "No"} />
                <Info
                  label="Instagram username"
                  value={
                    order.customer.instagramUsername
                      ? order.customer.instagramUsername.startsWith("@")
                        ? order.customer.instagramUsername
                        : `@${order.customer.instagramUsername}`
                      : "—"
                  }
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => copy(order.customer.phone, "Phone")}>
                  Copy phone
                </Button>
                <Button type="button" variant="outline" onClick={() => copy(order.orderCode, "Order code")}>
                  Copy order code
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Film delivery method to lab
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Info label="Method" value={formatFilmDeliveryMethod(order.filmDeliveryMethod)} />
              {order.filmDeliveryMethod === "parcel" ? (
                <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                  <p className="font-semibold">Ship films to:</p>
                  <p className="mt-2 font-semibold">{LAB_NAME}</p>
                  <p>{LAB_ADDRESS_LINE}</p>
                  <p className="text-muted-foreground">{LAB_PHONE_DISPLAY}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Film rolls
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {order.rolls.map((roll, index) => (
                <div key={roll.id} className="rounded-lg border bg-muted/30 p-4">
                  <p className="font-bold">Roll {index + 1}</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Info label="Film type" value={roll.filmType} />
                    <Info label="Film format" value={roll.format} />
                    <Info label="Film brand" value={getRollBrandLabel(roll)} />
                    {roll.brand === "Other" ? <Info label="Custom brand" value={roll.brandOther || "—"} /> : null}
                    <Info label="Film stock" value={getRollStockLabel(roll)} />
                    {roll.stock === "Other" || roll.brand === "Other" ? (
                      <Info label="Custom stock" value={roll.stockOther || "—"} />
                    ) : null}
                    {roll.filmType === "B&W" ? <Info label="B&W developer" value={roll.bwDeveloper} /> : null}
                    <Info
                      label="Film condition"
                      value={roll.experimentalFilm ? "Experimental Film / Film Soup" : roll.condition ?? "—"}
                    />
                    <Info label="Selected service" value={roll.service} />
                    <Info label="Push/Pull enabled" value={roll.pushPullEnabled ? "Yes" : "No"} />
                    {roll.pushPullEnabled ? (
                      <>
                        <Info label="Push/Pull type" value={roll.pushPullType} />
                        <Info label="Push/Pull stop" value={String(roll.pushPullStops)} />
                      </>
                    ) : (
                      <Info label="Push/Pull" value={formatPushPullLabel(roll)} />
                    )}
                    <Info label="Experimental Film / Film Soup" value={roll.experimentalFilm ? "Yes" : "No"} />
                    <Info label="Roll price" value={money(roll.price)} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Return method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Info label="Method" value={formatReturnMethod(order.returnMethod)} />
                <Info label="File delivery" value={order.delivery.fileDelivery} />
                {order.returnMethod === "post" ? (
                  <>
                    <Info label="Recipient name" value={order.delivery.recipientName} />
                    <Info label="Recipient phone" value={order.delivery.recipientPhone} />
                    <Info label="Shipping address" value={order.delivery.address} className="sm:col-span-2" />
                    <Info label="Shipping fee" value={money(order.shippingFee ?? 60)} />
                  </>
                ) : null}
                <Info label="Additional notes" value={order.delivery.notes} className="sm:col-span-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Payment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Info label="Payment method" value={formatPaymentMethod(order.payment?.method)} />
                <Info label="Payment status" value={formatPaymentStatus(order.payment?.status)} />
                <Info label="Bank name" value={order.payment?.bankName || "—"} />
                <Info label="Account number" value={order.payment?.accountNumber || "—"} />
                <Info label="Account name" value={order.payment?.accountName || "—"} />
                <Info label="Total amount" value={money(order.payment?.amount ?? order.totalPrice)} />
                <Info label="Slip file name" value={order.payment?.paymentSlipFileName || "—"} />
                <Info
                  label="Confirmed at"
                  value={order.payment?.confirmedAt ? shortDate(order.payment.confirmedAt) : "—"}
                />
              </div>

              {order.payment?.paymentSlipDataUrl ? (
                <div className="space-y-2">
                  <Button type="button" variant="outline" asChild>
                    <a href={order.payment.paymentSlipDataUrl} target="_blank" rel="noreferrer">
                      Open payment slip
                    </a>
                  </Button>
                  <div className="overflow-hidden rounded-lg border border-border/60 bg-muted/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={order.payment.paymentSlipDataUrl}
                      alt="Payment slip"
                      className="max-h-80 w-full object-contain"
                    />
                  </div>
                </div>
              ) : null}

              {showConfirmPayment ? (
                <Button type="button" className="w-full" onClick={confirmPayment} disabled={actionLoading !== null}>
                  {actionLoading === "payment" ? "Confirming..." : "Confirm Payment"}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardDescription className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                Pricing summary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.rolls.map((roll, index) => (
                <div key={roll.id} className="flex items-center justify-between text-sm">
                  <span>
                    Roll {index + 1} · {roll.service}
                  </span>
                  <span className="font-semibold">{money(roll.price)}</span>
                </div>
              ))}
              {typeof order.filmTotal === "number" ? (
                <div className="flex items-center justify-between text-sm">
                  <span>Film total</span>
                  <span className="font-semibold">{money(order.filmTotal)}</span>
                </div>
              ) : null}
              {typeof order.discountAmount === "number" && order.discountAmount > 0 ? (
                <div className="flex items-center justify-between text-sm text-emerald-700">
                  <span>Discount</span>
                  <span className="font-semibold">−{money(order.discountAmount)}</span>
                </div>
              ) : null}
              {typeof order.shippingFee === "number" && order.shippingFee > 0 ? (
                <div className="flex items-center justify-between text-sm">
                  <span>Shipping fee</span>
                  <span className="font-semibold">{money(order.shippingFee)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-bold">{money(order.totalPrice)}</span>
              </div>
            </CardContent>
          </Card>

          <OrderStatusControl
            orderId={order.id}
            status={order.status}
            onUpdated={(status) => setOrder({ ...order, status })}
          />

          <Card>
            <CardHeader>
              <CardDescription className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                LINE debug
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" variant="outline" onClick={sendTestLine} disabled={lineTestLoading}>
                {lineTestLoading ? "Sending..." : "Send Test LINE"}
              </Button>
              <p className="mt-2 text-sm text-muted-foreground">
                Sends the current order status Flex Message to the linked LINE user.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function Info({ label, value, className }: { label: string; value?: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value || "—"}</p>
    </div>
  );
}
