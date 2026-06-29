"use client";

import Image from "next/image";
import { Check, Gift } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { startCustomerInfoLineConnect, useLiff } from "@/components/line/LiffProvider";
import { applyLineProfileToCustomer } from "@/lib/line/customer-fields";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { loadDraft, saveDraft } from "@/lib/storage";
import type { CustomerDraft } from "@/lib/types";

const SKIP_LINE_CONNECT_KEY = "mfl:skip-line-connect-step1";

type Props = {
  customer: CustomerDraft | null;
  onCustomerChange: (customer: CustomerDraft) => void;
};

export function CustomerInfoLineConnectCard({ customer, onCustomerChange }: Props) {
  const { t } = useCustomerLanguage();
  const { liffIdConfigured } = useLiff();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(SKIP_LINE_CONNECT_KEY) === "1";
  });

  const lineConnected = Boolean(customer?.lineConnected && customer?.lineUserId);

  if (!liffIdConfigured || lineConnected || skipped) {
    if (lineConnected) {
      return (
        <div className="flex flex-col gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
          <Badge
            variant="outline"
            className="w-fit rounded-full border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-700"
          >
            <Check size={12} className="mr-1" />
            {t.customerInfo.lineConnectConnectedBadge}
          </Badge>
          <p className="text-sm text-muted-foreground">{t.customerInfo.lineConnectConnectedNote}</p>
        </div>
      );
    }
    return null;
  }

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const profile = await startCustomerInfoLineConnect();
      if (!profile) return;

      const draft = loadDraft();
      const base = draft.customer ?? { name: "", phone: "", email: "" };
      const nextCustomer = applyLineProfileToCustomer(base, profile);
      saveDraft({ ...draft, customer: nextCustomer });
      onCustomerChange(nextCustomer);
    } catch (connectError) {
      console.error("[CustomerInfoLineConnectCard] connect failed", connectError);
      setError(t.customerInfo.lineConnectFailed);
    } finally {
      setConnecting(false);
    }
  };

  const handleSkip = () => {
    sessionStorage.setItem(SKIP_LINE_CONNECT_KEY, "1");
    setSkipped(true);
  };

  return (
    <Card className="border-accent/20 bg-accent/[0.03] shadow-none">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-accent" />
            <h2 className="text-base font-semibold text-foreground">{t.customerInfo.lineConnectTitle}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{t.customerInfo.lineConnectDescription}</p>
        </div>

        <ul className="space-y-1.5 text-sm text-foreground/85">
          <li>• {t.customerInfo.lineConnectBenefitUpdates}</li>
          <li>• {t.customerInfo.lineConnectBenefitPickup}</li>
          <li>• {t.customerInfo.lineConnectBenefitDiscount}</li>
        </ul>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            className="h-11 flex-1 gap-2 bg-[#06C755] text-white hover:bg-[#05b34c]"
            onClick={() => void handleConnect()}
            disabled={connecting}
          >
            <Image src="/line-app-icon.png" alt="" width={20} height={20} className="size-5 rounded" aria-hidden />
            {connecting ? t.customerInfo.lineConnecting : t.customerInfo.lineConnectCta}
          </Button>
          <Button type="button" variant="outline" className="h-11 flex-1" onClick={handleSkip}>
            {t.customerInfo.lineConnectSkip}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">{t.customerInfo.lineConnectLaterNote}</p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
