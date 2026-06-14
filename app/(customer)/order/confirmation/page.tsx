"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { ScanDriveLinkCard } from "@/components/customer/ScanDriveLinkCard";
import { StatusTimeline } from "@/components/customer/StatusTimeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fetchOrderByCode } from "@/lib/customer/api";
import { useOrderStatusRealtime } from "@/lib/customer/useOrderStatusRealtime";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { orderCode, pageTitleLarge, stepEyebrow } from "@/lib/typography";
import { getLastOrderCode } from "@/lib/storage";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <CustomerLayout>
          <Card className="mx-auto max-w-3xl p-8 text-center shadow-soft">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </Card>
        </CustomerLayout>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const { t } = useCustomerLanguage();
  const [code, setCode] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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

  const loadLatestOrder = useCallback(async (orderCodeValue: string) => {
    if (!orderCodeValue.trim()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { order: found } = await fetchOrderByCode(orderCodeValue);
      if (found) {
        setOrder(found);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const orderCode = searchParams.get("code") ?? getLastOrderCode() ?? "";
    setCode(orderCode);
    void loadLatestOrder(orderCode);
  }, [searchParams, loadLatestOrder]);

  return (
    <CustomerLayout>
      <Card className="mx-auto max-w-3xl overflow-visible text-center shadow-soft">
        <CardHeader className="p-5 sm:p-8">
          <p className={stepEyebrow}>{t.confirmation.submitted}</p>
          <h1 className={cn("mt-2", pageTitleLarge)}>{t.confirmation.title}</h1>
          <p className="mt-4 text-lg font-normal text-muted-foreground">{t.confirmation.subtitle}</p>
        </CardHeader>
        <CardContent className="space-y-6 overflow-visible p-5 pt-0 sm:px-8 sm:pb-8">
          <div className="mx-auto max-w-sm rounded-lg border border-dashed border-border bg-muted/50 p-5">
            <p className="text-sm font-semibold text-muted-foreground">{t.confirmation.orderCode}</p>
            <p className={cn("mt-2 text-4xl", orderCode)}>{code || "—"}</p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mx-auto flex h-10 gap-2 border-border/80 px-4 text-sm font-semibold"
            onClick={() => loadLatestOrder(code)}
            disabled={loading || !code}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            {loading ? t.confirmation.refreshing : t.confirmation.refresh}
          </Button>

          <StatusTimeline status={order?.status ?? "Received"} />
          {order ? <ScanDriveLinkCard order={order} /> : null}

          <div className="flex justify-center pt-2">
            <Button asChild variant="outline" className="h-11 min-w-[10rem]">
              <Link href="/">{t.confirmation.backHome}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </CustomerLayout>
  );
}
