"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { cn } from "@/lib/utils";

export function PaymentStatusBanner({ compact = false }: { compact?: boolean }) {
  const { t } = useCustomerLanguage();

  return (
    <Card className={cn("border-amber-400/30 bg-amber-50/80 shadow-soft", compact && "shadow-none")}>
      <CardContent className={cn("p-5", compact && "p-4")}>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-900/70">{t.payment.statusLabel}</p>
        <p className="mt-2 text-base font-bold text-amber-950">{t.payment.statusTitle}</p>
        <p className="mt-2 text-sm leading-relaxed text-amber-950/80">{t.payment.statusDescription}</p>
      </CardContent>
    </Card>
  );
}
