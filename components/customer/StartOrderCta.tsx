"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLiff } from "@/components/line/LiffProvider";
import { fetchWelcomePromoEligibility } from "@/lib/customer/api";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { loadDraft } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function StartOrderCta() {
  const { t } = useCustomerLanguage();
  const { ready: liffReady, profile } = useLiff();
  const [showPromo, setShowPromo] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!liffReady) return;

    const draft = loadDraft();
    const customer = draft.customer;

    void fetchWelcomePromoEligibility({
      lineUserId: profile?.userId ?? customer?.lineUserId,
      phone: customer?.phone,
      email: customer?.email
    })
      .then((result) => {
        setShowPromo(result.eligible);
      })
      .catch((error) => {
        console.error("[StartOrderCta] eligibility check failed", error);
        setShowPromo(true);
      })
      .finally(() => {
        setChecked(true);
      });
  }, [liffReady, profile?.userId]);

  return (
    <div className="flex w-full flex-col items-center gap-2.5">
      {checked && showPromo ? (
        <Badge
          variant="outline"
          className={cn(
            "rounded-full border-accent/30 bg-accent/10 px-3 py-1 text-[11px] font-bold tracking-[0.04em] text-accent shadow-none"
          )}
        >
          {t.home.welcomePromoBadge}
        </Badge>
      ) : null}

      <Button asChild size="lg" className="min-h-16 w-full text-base">
        <Link href="/order">{t.home.startOrder}</Link>
      </Button>
    </div>
  );
}
