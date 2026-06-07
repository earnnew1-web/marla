"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  filmFlowCard,
  filmFlowCardContent,
  filmFlowCardHeader,
  filmFlowCardTitle,
  filmFlowDivider,
  filmFlowInset
} from "@/components/customer/filmFlowStyles";
import { bahtSpaced } from "@/lib/format";
import { getStep2OrderSummary } from "@/lib/order-pricing";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { sectionTitle } from "@/lib/typography";
import type { FilmRoll, FilmType, ReturnMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  rolls: FilmRoll[];
  returnMethod: ReturnMethod;
};

function filmTypeLabel(filmType: FilmType, t: ReturnType<typeof useCustomerLanguage>["t"]) {
  switch (filmType) {
    case "Color (C-41)":
      return `${t.filmRolls.colorC41} ${t.filmRolls.colorC41Subtitle}`;
    case "ECN-2":
      return `${t.filmRolls.motionEcn2} ${t.filmRolls.motionEcn2Subtitle}`;
    default:
      return t.filmRolls.bw;
  }
}

function lineLabel(label: string, t: ReturnType<typeof useCustomerLanguage>["t"]) {
  if (label === "Experimental Film / Film Soup") {
    return t.filmRolls.filmSoupShort;
  }
  return label;
}

export function FilmRollsOrderSummary({ rolls, returnMethod }: Props) {
  const { t } = useCustomerLanguage();
  const summary = getStep2OrderSummary(rolls, returnMethod);

  return (
    <Card className={filmFlowCard}>
      <CardHeader className={filmFlowCardHeader}>
        <h2 className={filmFlowCardTitle}>{t.filmRolls.orderSummary}</h2>
      </CardHeader>
      <CardContent className={filmFlowCardContent}>
        <div className="space-y-5">
          {summary.rolls.map(({ roll, lines, subtotal }, index) => (
            <div key={roll.id} className={cn(index > 0 && "border-t border-border/50 pt-5")}>
              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">
                  {t.filmRolls.filmNumber.replace("{n}", String(index + 1))}
                </p>
                <p className="text-xs text-muted-foreground">
                  {filmTypeLabel(roll.filmType, t)} · {roll.format}
                </p>
              </div>

              <div className="mt-3 space-y-2">
                {lines.map((line) => (
                  <div key={line.label} className="flex items-center justify-between text-sm">
                    <span className="text-foreground/80">{lineLabel(line.label, t)}</span>
                    <span className="font-medium tabular-nums">{bahtSpaced(line.amount)}</span>
                  </div>
                ))}
                <div className={cn("flex items-center justify-between border-t border-border/40 pt-2.5 text-sm", filmFlowDivider)}>
                  <span className="font-semibold text-foreground/90">{t.filmRolls.rollSubtotal}</span>
                  <span className="font-bold tabular-nums">{bahtSpaced(subtotal)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={cn(filmFlowInset, "mt-2 space-y-3")}>
          <p className={sectionTitle}>{t.filmRolls.orderLevelPricing}</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/85">{t.filmRolls.shipping}</span>
            <span className="font-medium tabular-nums">{bahtSpaced(summary.shipping)}</span>
          </div>
          {summary.filmageDiscount < 0 ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/85">{t.filmRolls.filmageDiscountLabel}</span>
              <span className="font-medium tabular-nums">{bahtSpaced(summary.filmageDiscount)}</span>
            </div>
          ) : null}
          <div className={cn("flex items-center justify-between border-t pt-3", filmFlowDivider)}>
            <span className={sectionTitle}>{t.filmRolls.estimatedTotal}</span>
            <span className="text-xl font-bold tabular-nums text-foreground">{bahtSpaced(summary.estimatedTotal)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
