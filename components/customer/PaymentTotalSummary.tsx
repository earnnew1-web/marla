"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DiscountCodeField, type AppliedDiscount } from "@/components/customer/DiscountCodeField";
import {
  filmFlowCard,
  filmFlowCardContent,
  filmFlowDivider,
  filmFlowInset,
  filmFlowNestedInset
} from "@/components/customer/filmFlowStyles";
import { baht, bahtSpaced } from "@/lib/format";
import { getOrderPriceBreakdown, type OrderBreakdownKey } from "@/lib/order-pricing";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { sectionTitle } from "@/lib/typography";
import type { CustomerDraft, FilmRoll, ReturnMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  rolls: FilmRoll[];
  returnMethod: ReturnMethod;
  customer?: CustomerDraft;
  welcomeDiscount?: AppliedDiscount | null;
  manualDiscount?: AppliedDiscount | null;
  onManualDiscountChange: (discount: AppliedDiscount | null) => void;
};

export function PaymentTotalSummary({
  rolls,
  returnMethod,
  customer,
  welcomeDiscount = null,
  manualDiscount = null,
  onManualDiscountChange
}: Props) {
  const { t } = useCustomerLanguage();
  const [expanded, setExpanded] = useState(false);
  const effectiveDiscount = welcomeDiscount ?? manualDiscount;
  const { lines, estimatedTotal } = getOrderPriceBreakdown(rolls, returnMethod, effectiveDiscount);
  const subtotal = getOrderPriceBreakdown(rolls, returnMethod, null).estimatedTotal;

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
      <CardContent className={cn(filmFlowCardContent, "space-y-5 py-5")}>
        <p className={sectionTitle}>{t.payment.orderSummaryTitle}</p>

        <div className={cn(filmFlowInset, "space-y-3 bg-card")}>
          <p className="text-sm font-semibold text-foreground">{t.payment.discountSectionTitle}</p>

          {welcomeDiscount ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                  <Check size={14} className="shrink-0 text-emerald-700" aria-hidden />
                  {t.payment.welcomeGiftSummaryApplied}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.payment.welcomeGiftAppliedAutoBadge}</p>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums text-emerald-700">
                {t.payment.welcomeGiftSummaryAmount}
              </span>
            </div>
          ) : null}

          <DiscountCodeField
            customer={customer}
            appliedDiscount={manualDiscount}
            onApplied={onManualDiscountChange}
          />
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t.payment.totalLabel}</p>
            <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight text-foreground">{baht(estimatedTotal)}</p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-muted-foreground transition hover:bg-accent/[0.06] hover:text-foreground"
            aria-expanded={expanded}
          >
            {expanded ? t.payment.hideDetails : t.payment.viewDetails}
            <ChevronDown
              size={16}
              className={cn("transition-transform duration-300 ease-out", expanded && "rotate-180")}
            />
          </button>
        </div>

        <div className="space-y-2 border-t border-border/60 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t.payment.subtotal}</span>
            <span className="font-medium tabular-nums text-foreground">{bahtSpaced(subtotal)}</span>
          </div>
          {welcomeDiscount ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-700">{t.payment.welcomeGiftLine}</span>
              <span className="font-semibold tabular-nums text-emerald-700">
                {t.payment.welcomeGiftSummaryAmount}
              </span>
            </div>
          ) : null}
          {manualDiscount ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-700">
                {t.payment.discountLine.replace("{code}", manualDiscount.code)}
              </span>
              <span className="font-semibold tabular-nums text-emerald-700">
                {bahtSpaced(-manualDiscount.amount)}
              </span>
            </div>
          ) : null}
          <div className={cn("flex items-center justify-between border-t pt-3", filmFlowDivider)}>
            <span className={sectionTitle}>{t.payment.totalLabel}</span>
            <span className="text-lg font-bold tabular-nums text-foreground">{bahtSpaced(estimatedTotal)}</span>
          </div>
        </div>

        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
            expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className={cn(filmFlowNestedInset, "space-y-3")}>
              {detailLines.map((line) => (
                <div key={line.key} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/85">{labelForKey(line.key, line.promoCode)}</span>
                  <span className="font-medium tabular-nums">
                    {bahtSpaced(line.amount, line.amount > 0 && line.key !== "filmTotal")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
