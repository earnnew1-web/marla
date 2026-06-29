"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { filmFlowCard } from "@/components/customer/filmFlowStyles";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { cn } from "@/lib/utils";

type Props = {
  applied: boolean;
  showClaim: boolean;
  connecting: boolean;
  connectError: string | null;
  onConnectLine: () => void;
};

export function WelcomeGiftCard({ applied, showClaim, connecting, connectError, onConnectLine }: Props) {
  const { t } = useCustomerLanguage();

  if (!applied && !showClaim) {
    return null;
  }

  if (applied) {
    return (
      <Card className={cn(filmFlowCard, "border-emerald-500/25 bg-emerald-500/[0.05] shadow-soft")}>
        <CardContent className="flex items-start justify-between gap-4 p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-base font-semibold text-foreground">{t.payment.welcomeGiftAppliedCardTitle}</p>
            <div>
              <p className="text-lg font-bold text-emerald-700">{t.payment.welcomeGiftAppliedAmount}</p>
              <p className="text-sm text-muted-foreground">{t.payment.welcomeGiftAppliedLabel}</p>
            </div>
          </div>
          <Badge className="shrink-0 rounded-full border-emerald-500/30 bg-emerald-500/12 px-3 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-500/12">
            {t.payment.welcomeGiftAppliedAutoBadge}
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <Card className={cn(filmFlowCard, "border-accent/15 bg-accent/[0.04] shadow-soft")}>
        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="space-y-2">
            <p className="text-base font-semibold text-foreground">{t.payment.welcomeGiftPromoTitle}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t.payment.welcomeGiftPromoDescriptionPrefix}
              <span className="font-bold text-foreground">{t.payment.welcomeGiftPromoDescriptionHighlight}</span>
              {t.payment.welcomeGiftPromoDescriptionSuffix}
            </p>
          </div>
          <Button
            type="button"
            className="h-11 w-full gap-2 bg-[#06C755] text-white hover:bg-[#05b34c] sm:w-auto sm:min-w-[11rem]"
            onClick={onConnectLine}
            disabled={connecting}
          >
            <Image src="/line-app-icon.png" alt="" width={20} height={20} className="size-5 rounded" aria-hidden />
            {connecting ? t.confirmation.connectLineConnecting : t.confirmation.connectLineCta}
          </Button>
          <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{t.payment.welcomeGiftPromoCaption}</p>
        </CardContent>
      </Card>
      {connectError ? <p className="text-sm text-destructive">{connectError}</p> : null}
    </div>
  );
}
