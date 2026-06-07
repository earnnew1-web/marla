"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LabAddressCard } from "@/components/customer/LabAddressCard";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { cardTitle } from "@/lib/typography";

export function FilmDeliveryReminder() {
  const { t } = useCustomerLanguage();

  return (
    <Card className="border-accent/20 bg-accent/[0.04] shadow-soft">
      <CardHeader className="space-y-2 p-5 pb-2 sm:p-6 sm:pb-3">
        <h2 className={cardTitle}>{t.track.filmDeliveryReminderTitle}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{t.track.filmDeliveryReminderText}</p>
      </CardHeader>
      <CardContent className="p-5 pt-0 sm:px-6 sm:pb-6">
        <LabAddressCard className="bg-card/80" />
      </CardContent>
    </Card>
  );
}
