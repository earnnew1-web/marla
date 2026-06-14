"use client";

import { RefreshCw, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { FilmDeliveryReminder } from "@/components/customer/FilmDeliveryReminder";
import { OrderSummary } from "@/components/customer/OrderSummary";
import { ScanDriveLinkCard } from "@/components/customer/ScanDriveLinkCard";
import { StatusTimeline } from "@/components/customer/StatusTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackOrderByCodeAndPhone } from "@/lib/customer/api";
import { useOrderStatusRealtime } from "@/lib/customer/useOrderStatusRealtime";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { orderCode, pageTitle, stepEyebrow } from "@/lib/typography";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function TrackOrderPage() {
  const { t } = useCustomerLanguage();
  const [orderCode, setOrderCode] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useOrderStatusRealtime(order?.id, (update) => {
    setOrder((current) =>
      current
        ? {
            ...current,
            status: update.status,
            scanDriveUrl: update.scanDriveUrl ?? current.scanDriveUrl
          }
        : current
    );
  });

  const fetchOrder = useCallback(
    async (code: string, phoneNumber: string) => {
      setLoading(true);
      setError("");
      try {
        const { order: found } = await trackOrderByCodeAndPhone(code, phoneNumber);
        setOrder(found);
        setSearched(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : t.track.failed;
        setError(message);
        toast.error(message);
        setSearched(true);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    },
    [t.track.failed]
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await fetchOrder(orderCode, phone);
  };

  const refresh = async () => {
    if (!orderCode.trim() || !phone.trim()) return;
    await fetchOrder(orderCode, phone);
  };

  return (
    <CustomerLayout>
      <div className="mx-auto max-w-3xl space-y-4">
        <Card className="shadow-soft">
          <form onSubmit={submit}>
            <CardHeader className="p-5 sm:p-7">
              <p className={stepEyebrow}>{t.track.label}</p>
              <h1 className={cn("mt-2", pageTitle)}>{t.track.title}</h1>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-0 sm:px-7 sm:pb-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="track-order-code">{t.track.orderCode}</Label>
                  <Input
                    id="track-order-code"
                    className="h-11"
                    placeholder="MFL-1024"
                    value={orderCode}
                    onChange={(event) => setOrderCode(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="track-phone">{t.track.phone}</Label>
                  <Input
                    id="track-phone"
                    className="h-11"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </div>
              </div>
              <Button className="h-11 w-full" type="submit" disabled={loading}>
                <Search size={18} />
                {loading ? t.track.searching : t.track.search}
              </Button>
            </CardContent>
          </form>
        </Card>

        {error ? (
          <p className="rounded-lg bg-destructive/10 p-4 text-sm font-semibold text-destructive">{error}</p>
        ) : null}
        {searched && !order && !error ? (
          <p className="rounded-lg bg-destructive/10 p-4 text-sm font-semibold text-destructive">{t.track.notFound}</p>
        ) : null}

        {order ? (
          <div className="space-y-4">
            <Card className="overflow-visible shadow-soft">
              <CardContent className="space-y-6 overflow-visible p-5 text-center sm:p-7">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{t.track.orderCode}</p>
                  <p className={cn("mt-2 text-3xl", orderCode)}>{order.orderCode}</p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mx-auto flex h-10 gap-2 border-border/80 px-4 text-sm font-semibold"
                  onClick={refresh}
                  disabled={loading}
                >
                  <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
                  {loading ? t.track.searching : t.track.refresh}
                </Button>

                <StatusTimeline status={order.status} />
                <ScanDriveLinkCard order={order} />
              </CardContent>
            </Card>
            {order.filmDeliveryMethod === "parcel" ? <FilmDeliveryReminder /> : null}
            <OrderSummary order={order} />
          </div>
        ) : null}
      </div>
    </CustomerLayout>
  );
}
