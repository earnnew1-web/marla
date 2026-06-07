"use client";

import { Copy } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  filmFlowCard,
  filmFlowCardContent,
  filmFlowCardHeader,
  filmFlowCardTitle,
  filmFlowNestedInset
} from "@/components/customer/filmFlowStyles";
import {
  ACCOUNT_NAME_EN,
  ACCOUNT_NAME_TH,
  ACCOUNT_NUMBER,
  ACCOUNT_NUMBER_COPY,
  BANK_NAME,
  BANK_NAME_EN,
  KRUNGSRI_LOGO_SRC,
  PAYMENT_QR_SRC
} from "@/lib/payment";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { sectionTitle } from "@/lib/typography";
import { cn } from "@/lib/utils";

export function PaymentDetailsCard() {
  const { t, language } = useCustomerLanguage();
  const bankName = language === "th" ? BANK_NAME : BANK_NAME_EN;

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(ACCOUNT_NUMBER_COPY);
      toast.success(t.payment.copySuccess);
    } catch {
      toast.error(t.payment.copyFailed);
    }
  };

  return (
    <Card className={filmFlowCard}>
      <CardHeader className={filmFlowCardHeader}>
        <h2 className={filmFlowCardTitle}>{t.payment.detailsTitle}</h2>
      </CardHeader>
      <CardContent className={filmFlowCardContent}>
        <div className={filmFlowNestedInset}>
          <div className="flex flex-col items-center text-center">
            <p className={cn(sectionTitle, "text-foreground/80")}>{t.payment.scanToPay}</p>
            <div className="mt-3 inline-flex rounded-2xl border border-border/50 bg-white p-4 shadow-[0_1px_2px_rgba(37,29,24,0.05)]">
              <Image
                src={PAYMENT_QR_SRC}
                alt={t.payment.scanToPay}
                width={240}
                height={240}
                className="block h-auto w-[180px] sm:w-[200px] md:w-[240px]"
                priority
              />
            </div>
          </div>

          <div className="mt-6 space-y-5 border-t border-border/50 pt-6 text-left">
            <div className="flex items-center gap-2.5">
              <Image
                src={KRUNGSRI_LOGO_SRC}
                alt=""
                width={28}
                height={28}
                className="h-[22px] w-auto shrink-0 sm:h-7"
              />
              <p className="text-sm font-semibold text-foreground">{bankName}</p>
            </div>

            <div>
              <p className={sectionTitle}>{t.payment.accountNumberLabel}</p>
              <p className="mt-1.5 text-2xl font-extrabold tabular-nums tracking-wide text-foreground sm:text-3xl">
                {ACCOUNT_NUMBER}
              </p>
            </div>

            <div>
              <p className={sectionTitle}>{t.payment.accountNameLabel}</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{ACCOUNT_NAME_EN}</p>
              <p className="mt-0.5 text-sm text-foreground/75">{ACCOUNT_NAME_TH}</p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-6 h-11 w-full gap-2 font-semibold"
            onClick={copyAccount}
          >
            <Copy size={16} />
            {t.payment.copyAccount}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
