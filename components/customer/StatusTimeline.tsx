"use client";

import type { OrderStatus } from "@/lib/types";
import { normalizeStatusValue } from "@/lib/admin/status-styles";
import { OrderProgressTracker } from "@/components/customer/OrderProgressTracker";
import { PaymentStatusBanner } from "@/components/customer/PaymentStatusBanner";
import { Badge } from "@/components/ui/badge";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";

export function normalizeStatus(status: OrderStatus | string): OrderStatus {
  return normalizeStatusValue(status);
}

export function StatusTimeline({ status }: { status: OrderStatus | string }) {
  const { t } = useCustomerLanguage();
  const normalized = normalizeStatus(status);

  if (normalized === "Pending Payment Confirmation") {
    return (
      <div className="space-y-4">
        <PaymentStatusBanner compact />
        <OrderProgressTracker status="Received" />
      </div>
    );
  }

  if (normalized === "Cancelled") {
    return (
      <Badge variant="destructive" className="w-full justify-center px-4 py-3 text-sm font-semibold">
        {t.timeline.cancelled}
      </Badge>
    );
  }

  return <OrderProgressTracker status={normalized} />;
}
