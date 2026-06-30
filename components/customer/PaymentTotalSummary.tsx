"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  filmFlowCard,
  filmFlowCardContent,
  filmFlowDivider
} from "@/components/customer/filmFlowStyles";
import { bahtSpaced } from "@/lib/format";
import { getOrderPriceBreakdown, type OrderBreakdownKey } from "@/lib/order-pricing";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { sectionTitle } from "@/lib/typography";
import type { AppliedDiscount } from "@/components/customer/DiscountCodeField";
import type { FilmRoll, ReturnMethod } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WELCOME_GIFT_PLACEHOLDER_CODE } from "@/lib/customer-coupons";

type Props = {
  rolls: FilmRoll[];
  returnMethod: ReturnMethod;
  appliedDiscount?: AppliedDiscount | null;
};

function discountSummaryLabel(
  discount: AppliedDiscount,
  t: ReturnType<typeof useCustomerLanguage>["t"]
) {
  if (discount.code === WELCOME_GIFT_PLACEHOLDER_CODE) {
    return t.payment.firstOrderDiscountApplied;
  }
  return t.payment.discountLine.replace("{code}", discount.code);
}

export function PaymentTotalSummary({
  rolls,
  returnMethod,
  appliedDiscount = null
}: Props) {
  const { t } = useCustomerLanguage();
  const { lines, estimatedTotal } = getOrderPriceBreakdown(rolls, returnMethod, appliedDiscount);

  const labelForKey = (key: OrderBreakdownKey, promoCode?: string) => {
    switch (key) {
      case "filmTotal":
        return t.payment.filmTotal;
      case "shipping":
        return t.payment.shipping;
      case "pushPull":
        return t.payment.pushPull;
      case "filmSoup":
        return t.payment.filmSoup;
      case "filmageDiscount":
        return t.payment.filmageDiscount;
      case "promoDiscount":
        return t.payment.discountLine.replace("{code}", promoCode ?? "");
      default:
        return key;
    }
  };

  const detailLines = lines.filter((line) => line.key !== "promoDiscount");

  return (
    <Card className={cn(filmFlowCard, "overflow-visible")}>
      <CardContent className={cn(filmFlowCardContent, "space-y-4 py-5")}>
        <p className={sectionTitle}>{t.payment.orderSummaryTitle}</p>

        <div className="space-y-3">
          {detailLines.map((line) => (
            <div key={line.key} className="flex items-center justify-between text-sm">
              <span className="text-foreground/85">{labelForKey(line.key, line.promoCode)}</span>
              <span className="font-medium tabular-nums">
                {bahtSpaced(line.amount, line.amount > 0 && line.key !== "filmTotal")}
              </span>
            </div>
          ))}

          {appliedDiscount ? (
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-emerald-700">{discountSummaryLabel(appliedDiscount, t)}</span>
              <span className="font-semibold tabular-nums text-emerald-700">
                {bahtSpaced(-appliedDiscount.amount)}
              </span>
            </div>
          ) : null}

          <div className={cn("flex items-center justify-between border-t pt-3", filmFlowDivider)}>
            <span className={cn(sectionTitle, "text-base")}>{t.payment.totalLabel}</span>
            <span className="text-xl font-bold tabular-nums text-foreground">{bahtSpaced(estimatedTotal)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
