"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  filmFlowCard,
  filmFlowCardContent,
  filmFlowDivider,
  filmFlowInset
} from "@/components/customer/filmFlowStyles";
import { baht, bahtSpaced } from "@/lib/format";
import { getOrderPriceBreakdown, type OrderBreakdownKey } from "@/lib/order-pricing";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { sectionTitle } from "@/lib/typography";
import type { FilmRoll, ReturnMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  rolls: FilmRoll[];
  returnMethod: ReturnMethod;
};

export function PaymentTotalSummary({ rolls, returnMethod }: Props) {
  const { t } = useCustomerLanguage();
  const [expanded, setExpanded] = useState(false);
  const { lines, estimatedTotal } = getOrderPriceBreakdown(rolls, returnMethod);

  const labelForKey = (key: OrderBreakdownKey) => {
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
      default:
        return key;
    }
  };

  return (
    <Card className={filmFlowCard}>
      <CardContent className={cn(filmFlowCardContent, "space-y-0 py-5")}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className={sectionTitle}>{t.payment.totalLabel}</p>
            <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-foreground">{baht(estimatedTotal)}</p>
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

        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out",
            expanded ? "mt-5 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className={cn(filmFlowInset, "space-y-3")}>
              {lines.map((line) => (
                <div key={line.key} className="flex items-center justify-between text-sm">
                  <span className="text-foreground/85">{labelForKey(line.key)}</span>
                  <span className="font-medium tabular-nums">{bahtSpaced(line.amount, line.amount > 0 && line.key !== "filmTotal")}</span>
                </div>
              ))}
              <div className={cn("flex items-center justify-between border-t pt-3", filmFlowDivider)}>
                <span className={sectionTitle}>{t.payment.estimatedTotal}</span>
                <span className="text-lg font-bold tabular-nums text-foreground">{bahtSpaced(estimatedTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
