"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { money } from "@/lib/format";
import { formatPushPullLabel, getRollBrandLabel, getRollStockLabel } from "@/lib/film-roll";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { priceRoll, priceTotal } from "@/lib/pricing";
import { sectionTitle, sectionTitleLarge } from "@/lib/typography";
import type { DraftOrder, Order } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  draft?: DraftOrder;
  order?: Order;
};

export function OrderSummary({ draft, order }: Props) {
  const { t } = useCustomerLanguage();
  const customer = order?.customer ?? draft?.customer;
  const rolls = order?.rolls ?? draft?.rolls ?? [];
  const delivery = order?.delivery ?? draft?.delivery;
  const wantsDelivery = delivery?.filmReturn === "Delivery (+60 THB)";
  const filmTotal = rolls.reduce((sum, roll) => sum + priceRoll(roll), 0);
  const shipping = wantsDelivery ? 60 : 0;
  const total = order?.totalPrice ?? priceTotal(rolls, wantsDelivery);

  return (
    <div className="space-y-4">
      <Card className="shadow-soft">
        <CardHeader className="p-5 pb-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{t.orderSummary.customer}</p>
          <CardTitle className={sectionTitleLarge}>{t.orderSummary.customerInfo}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-5 text-sm sm:grid-cols-2">
          <Info label={t.orderSummary.name} value={customer?.name} fallback={t.orderSummary.notProvided} />
          <Info label={t.orderSummary.phone} value={customer?.phone} fallback={t.orderSummary.notProvided} />
          <Info label={t.orderSummary.line} value={customer?.lineId} fallback={t.orderSummary.notProvided} />
          <Info label={t.orderSummary.email} value={customer?.email} fallback={t.orderSummary.notProvided} />
          <Info
            label={t.orderSummary.allowSocialShare}
            value={customer?.allowSocialShare ? t.orderSummary.yes : t.orderSummary.no}
            fallback={t.orderSummary.no}
          />
          {customer?.allowSocialShare ? (
            <Info
              label={t.orderSummary.instagram}
              value={customer.instagramUsername ?? undefined}
              fallback={t.orderSummary.notProvided}
            />
          ) : null}
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="p-5 pb-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{t.orderSummary.film}</p>
          <CardTitle className={sectionTitleLarge}>{t.orderSummary.rolls}</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="divide-y divide-border">
            {rolls.map((roll, index) => (
              <div key={roll.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold">
                      {t.orderSummary.roll} #{index + 1}: {getRollBrandLabel(roll)} {getRollStockLabel(roll)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {roll.filmType} · {roll.format} · {roll.service}
                      {roll.pushPullEnabled ? ` · ${formatPushPullLabel(roll)}` : ""}
                      {roll.experimentalFilm ? ` · ${t.orderSummary.experimental}` : ""}
                    </p>
                    {roll.condition ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t.orderSummary.condition}: {roll.condition}
                      </p>
                    ) : null}
                    {roll.filmType === "B&W" ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t.orderSummary.developer}: {roll.bwDeveloper.replace(" (Recommended)", "")}
                      </p>
                    ) : null}
                  </div>
                  <p className="whitespace-nowrap text-sm font-black">{money(priceRoll(roll))}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader className="p-5 pb-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{t.orderSummary.delivery}</p>
          <CardTitle className={sectionTitleLarge}>{t.orderSummary.filesReturn}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-5 text-sm sm:grid-cols-2">
          <Info label={t.orderSummary.fileDelivery} value={delivery?.fileDelivery} fallback={t.orderSummary.notProvided} />
          <Info label={t.orderSummary.filmReturn} value={delivery?.filmReturn} fallback={t.orderSummary.notProvided} />
          {delivery?.recipientName ? (
            <Info label={t.orderSummary.recipientName} value={delivery.recipientName} fallback={t.orderSummary.notProvided} />
          ) : null}
          {delivery?.recipientPhone ? (
            <Info label={t.orderSummary.recipientPhone} value={delivery.recipientPhone} fallback={t.orderSummary.notProvided} />
          ) : null}
          <Info label={t.orderSummary.address} value={delivery?.address} fallback={t.orderSummary.notProvided} />
          <Info label={t.orderSummary.notes} value={delivery?.notes} fallback={t.orderSummary.notProvided} />
        </CardContent>
      </Card>

      <Card className={cn("border-primary bg-primary text-primary-foreground shadow-soft")}>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between text-sm opacity-90">
            <span>{t.orderSummary.filmTotal}</span>
            <span className="font-semibold tabular-nums">{money(filmTotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm opacity-90">
            <span>{t.orderSummary.shipping}</span>
            <span className="font-semibold tabular-nums">{money(shipping)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-primary-foreground/20 pt-3">
            <p className={cn(sectionTitle, "opacity-75")}>{t.orderSummary.estimatedTotal}</p>
            <p className="text-3xl font-black">{money(total)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value, fallback }: { label: string; value?: string; fallback: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value || fallback}</p>
    </div>
  );
}
