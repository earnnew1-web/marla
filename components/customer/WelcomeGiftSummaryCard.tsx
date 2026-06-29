"use client";

import Image from "next/image";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { filmFlowCard } from "@/components/customer/filmFlowStyles";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { cn } from "@/lib/utils";

type AppliedProps = {
  variant: "applied";
};

type ClaimProps = {
  variant: "claim";
  connecting: boolean;
  onConnect: () => void;
  disabled?: boolean;
};

type Props = AppliedProps | ClaimProps;

export function WelcomeGiftSummaryCard(props: Props) {
  const { t } = useCustomerLanguage();

  if (props.variant === "applied") {
    return (
      <Card className={cn(filmFlowCard, "border-emerald-500/20 bg-emerald-500/[0.04] shadow-soft")}>
        <CardContent className="space-y-3 p-5 sm:p-6">
          <span className="inline-flex w-fit rounded-full bg-emerald-500/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
            {t.summary.appliedBadge}
          </span>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600">
              <Gift size={18} strokeWidth={2} />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">{t.summary.welcomeGiftAppliedTitle}</p>
              <p className="text-sm text-muted-foreground">{t.summary.welcomeGiftAppliedDescription}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(filmFlowCard, "shadow-soft")}>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Gift size={18} className="text-accent" strokeWidth={2} />
              <span>{t.summary.welcomeGiftClaimTitle}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t.summary.welcomeGiftClaimDescription}</p>
          </div>

          <Button
            type="button"
            className="h-12 w-full shrink-0 gap-2 bg-[#06C755] px-8 text-base font-semibold text-white hover:bg-[#05b34c] sm:h-14 sm:w-auto sm:min-w-[11rem]"
            onClick={props.onConnect}
            disabled={props.disabled || props.connecting}
          >
            <Image
              src="/line-app-icon.png"
              alt=""
              width={24}
              height={24}
              className="size-6 shrink-0 rounded-md"
              aria-hidden
            />
            {props.connecting ? t.confirmation.connectLineConnecting : t.confirmation.connectLineCta}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
