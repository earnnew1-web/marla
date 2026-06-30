"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DiscountCodeField, type AppliedDiscount } from "@/components/customer/DiscountCodeField";
import { filmFlowCard, filmFlowCardContent } from "@/components/customer/filmFlowStyles";
import { isWelcomeCouponCode } from "@/lib/customer-coupons";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { sectionTitle } from "@/lib/typography";
import type { CustomerDraft } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  customer?: CustomerDraft;
  welcomeDiscount?: AppliedDiscount | null;
  manualDiscount?: AppliedDiscount | null;
  onManualDiscountChange: (discount: AppliedDiscount | null) => void;
};

export function PaymentDiscountSection({
  customer,
  welcomeDiscount = null,
  manualDiscount = null,
  onManualDiscountChange
}: Props) {
  const { t } = useCustomerLanguage();
  const welcomeActive = Boolean(welcomeDiscount);
  const showWelcomeCode =
    welcomeDiscount?.code &&
    isWelcomeCouponCode(welcomeDiscount.code) &&
    welcomeDiscount.code !== "WELCOME-GIFT";

  const welcomeAppliedMessage = showWelcomeCode
    ? t.payment.discountCodeApplied.replace("{code}", welcomeDiscount!.code)
    : t.payment.firstOrderDiscountApplied;

  return (
    <Card className={cn(filmFlowCard, "overflow-visible")}>
      <CardContent className={cn(filmFlowCardContent, "space-y-3 py-5")}>
        <p className={sectionTitle}>{t.payment.discountSectionTitle}</p>

        {welcomeActive ? (
          <DiscountCodeField
            customer={customer}
            appliedDiscount={welcomeDiscount}
            onApplied={() => {}}
            locked
            appliedMessage={welcomeAppliedMessage}
          />
        ) : (
          <DiscountCodeField
            customer={customer}
            appliedDiscount={manualDiscount}
            onApplied={onManualDiscountChange}
          />
        )}
      </CardContent>
    </Card>
  );
}
