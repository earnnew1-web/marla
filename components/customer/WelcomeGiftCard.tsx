"use client";

import { Gift } from "lucide-react";
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

  const title = applied ? t.payment.welcomeGiftAppliedCardTitle : t.payment.welcomeGiftTitle;
  const amount = t.payment.welcomeGiftAppliedAmount;
  const label = t.payment.welcomeGiftAppliedLabel;

  return (
    <div className="space-y-2">
      <Card className={cn(filmFlowCard, "overflow-visible")}>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#06C755]"
              aria-hidden
            >
              <Gift className="size-5 text-white" strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-emerald-800">{title}</p>
              <p className="text-lg font-bold leading-tight text-[#06C755] sm:text-xl">{amount}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </div>

          {showClaim ? (
            <Button
              type="button"
              className="h-10 shrink-0 rounded-full bg-[#06C755] px-6 text-sm font-semibold text-white hover:bg-[#05b34c] sm:min-w-[9.5rem]"
              onClick={onConnectLine}
              disabled={connecting}
            >
              {connecting ? t.confirmation.connectLineConnecting : t.confirmation.connectLineCta}
            </Button>
          ) : null}
        </CardContent>
      </Card>
      {connectError ? <p className="text-sm text-destructive">{connectError}</p> : null}
    </div>
  );
}
