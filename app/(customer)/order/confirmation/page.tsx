"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { LineConnectCard } from "@/components/customer/LineConnectCard";
import { ScanDriveLinkCard } from "@/components/customer/ScanDriveLinkCard";
import { Button } from "@/components/ui/button";
import { fetchOrderByCode } from "@/lib/customer/api";
import { useOrderStatusRealtime } from "@/lib/customer/useOrderStatusRealtime";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { successMessage } from "@/lib/typography";
import { getLastOrderCode } from "@/lib/storage";
import type { Order } from "@/lib/types";

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <CustomerLayout>
          <div className="mx-auto max-w-lg px-1 py-12 text-center">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
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
      return;
    }

    try {
      const { order: found } = await fetchOrderByCode(orderCodeValue);
      if (found) {
        setOrder(found);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const orderCodeParam = searchParams.get("code") ?? getLastOrderCode() ?? "";
    setCode(orderCodeParam);
    void loadLatestOrder(orderCodeParam);
  }, [searchParams, loadLatestOrder]);

  const lineConnected = Boolean(order?.customer.lineConnected && order?.customer.lineUserId);

  return (
    <CustomerLayout>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-10 px-1 py-8 sm:gap-12 sm:py-10">
        <section className="space-y-5 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 size={34} strokeWidth={2} />
          </div>
          <div className="space-y-3">
            <h1 className={successMessage}>{t.confirmation.title}</h1>
            <div className="space-y-1 text-base leading-relaxed text-muted-foreground">
              <p>{t.confirmation.descriptionLine1}</p>
              <p>{t.confirmation.descriptionLine2}</p>
            </div>
          </div>
        </section>

        {code ? (
          <section className="space-y-4">
            <LineConnectCard
              orderCode={code}
              lineConnected={lineConnected}
              status={order?.status ?? "Received"}
              showAutoUpdateCaption
              onLinked={(updatedOrder) => setOrder(updatedOrder)}
            />
            {order ? <ScanDriveLinkCard order={order} /> : null}
          </section>
        ) : null}

        <section className="pt-1">
          <Button asChild variant="ghost" className="h-11 w-full text-base font-medium text-muted-foreground">
            <Link href="/">{t.confirmation.backHome}</Link>
          </Button>
        </section>
      </div>
    </CustomerLayout>
  );
}
