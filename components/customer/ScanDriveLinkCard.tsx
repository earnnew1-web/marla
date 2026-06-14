"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import type { Order } from "@/lib/types";
import { orderRequiresScanDriveUrl } from "@/lib/order-scan";

export function ScanDriveLinkCard({ order }: { order: Pick<Order, "status" | "scanDriveUrl" | "rolls"> }) {
  const { t } = useCustomerLanguage();
  const url = order.scanDriveUrl?.trim();
  const showLink =
    Boolean(url) &&
    orderRequiresScanDriveUrl(order) &&
    (order.status === "Ready" || order.status === "Completed");

  if (!showLink || !url) return null;

  return (
    <Card className="border-accent/20 bg-accent/5 shadow-none">
      <CardContent className="space-y-3 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">{t.scanDelivery.label}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t.scanDelivery.description}</p>
        </div>
        <Button asChild className="h-11 w-full gap-2">
          <a href={url} target="_blank" rel="noopener noreferrer">
            {t.scanDelivery.openLink}
            <ExternalLink size={16} />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
