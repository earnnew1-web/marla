"use client";

import { Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { filmFlowNestedInset } from "@/components/customer/filmFlowStyles";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import {
  LAB_ADDRESS_COPY_TEXT,
  LAB_ADDRESS_LINE,
  LAB_NAME,
  LAB_PHONE_DISPLAY
} from "@/lib/lab-address";
import { sectionTitle } from "@/lib/typography";
import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  className?: string;
};

export function LabAddressCard({ title, className }: Props) {
  const { t } = useCustomerLanguage();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(LAB_ADDRESS_COPY_TEXT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={cn(filmFlowNestedInset, "space-y-4", className)}>
      <p className={cn(sectionTitle, "text-foreground/80")}>{title ?? t.customerInfo.shipToTitle}</p>
      <div className="space-y-1 text-sm leading-relaxed text-foreground">
        <p className="font-semibold">{LAB_NAME}</p>
        <p>{LAB_ADDRESS_LINE}</p>
        <p className="text-muted-foreground">{LAB_PHONE_DISPLAY}</p>
      </div>
      <div className="flex flex-col items-start gap-2">
        <Button type="button" variant="outline" size="sm" className="h-10 gap-2" onClick={copyAddress}>
          <Copy size={15} />
          {t.customerInfo.copyAddress}
        </Button>
        {copied ? (
          <p className="text-xs font-medium text-accent">{t.customerInfo.copyAddressSuccess}</p>
        ) : null}
      </div>
    </div>
  );
}
