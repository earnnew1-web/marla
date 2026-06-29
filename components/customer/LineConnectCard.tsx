"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Check, Copy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { startLineConnectLogin, useLiff } from "@/components/line/LiffProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { linkLineToOrder } from "@/lib/customer/api";
import { StatusTimeline } from "@/components/customer/StatusTimeline";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import type { LineProfile } from "@/lib/line/profile";
import type { Order, OrderStatus } from "@/lib/types";
import { orderCode as orderCodeClass } from "@/lib/typography";
import { cn } from "@/lib/utils";

type LineConnectCardProps = {
  orderCode: string;
  lineConnected: boolean;
  status: OrderStatus | string;
  showAutoUpdateCaption?: boolean;
  onLinked: (order: Order) => void;
};

export function LineConnectCard({
  orderCode,
  lineConnected,
  status,
  showAutoUpdateCaption = false,
  onLinked
}: LineConnectCardProps) {
  const { t } = useCustomerLanguage();
  const searchParams = useSearchParams();
  const { ready: liffReady, profile, liffIdConfigured } = useLiff();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState(lineConnected);
  const autoConnectAttempted = useRef(false);

  const performLink = useCallback(
    async (lineProfile: LineProfile) => {
      const { order } = await linkLineToOrder({
        orderCode,
        lineUserId: lineProfile.userId,
        lineDisplayName: lineProfile.displayName,
        linePictureUrl: lineProfile.pictureUrl ?? null
      });
      setLinked(true);
      setError(null);
      onLinked(order);
    },
    [orderCode, onLinked]
  );

  const handleConnect = useCallback(async () => {
    if (!orderCode.trim() || linked) return;

    setConnecting(true);
    setError(null);

    try {
      const lineProfile = await startLineConnectLogin(orderCode);
      if (!lineProfile) {
        return;
      }
      await performLink(lineProfile);
    } catch (linkError) {
      console.error("[LineConnectCard] connect failed", linkError);
      setError(t.confirmation.connectLineFailed);
    } finally {
      setConnecting(false);
    }
  }, [orderCode, linked, performLink, t.confirmation.connectLineFailed]);

  useEffect(() => {
    setLinked(lineConnected);
  }, [lineConnected]);

  useEffect(() => {
    const shouldAutoConnect = searchParams.get("connectLine") === "1";
    if (
      !shouldAutoConnect ||
      linked ||
      !orderCode.trim() ||
      !liffReady ||
      !profile?.userId ||
      autoConnectAttempted.current
    ) {
      return;
    }

    autoConnectAttempted.current = true;
    setConnecting(true);
    void performLink(profile)
      .catch((linkError) => {
        console.error("[LineConnectCard] auto-connect failed", linkError);
        setError(t.confirmation.connectLineFailed);
      })
      .finally(() => {
        setConnecting(false);
      });
  }, [searchParams, linked, orderCode, liffReady, profile, performLink, t.confirmation.connectLineFailed]);

  const copyOrderCode = async () => {
    if (!orderCode.trim()) return;
    try {
      await navigator.clipboard.writeText(orderCode.trim());
      toast.success(t.confirmation.orderCodeCopied);
    } catch {
      toast.error(t.common.errors.copyFailed);
    }
  };

  const timeline = (
    <StatusTimeline status={status} variant="compact" showAutoUpdateCaption={showAutoUpdateCaption} />
  );

  const dividerClass = linked && liffIdConfigured ? "border-emerald-500/15" : "border-border/60";

  const orderNumberBlock = (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {t.confirmation.orderCode}
        </p>
        <p className={cn("mt-1.5 truncate text-2xl sm:text-3xl", orderCodeClass)}>{orderCode || "—"}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0 border-border/70"
        onClick={() => void copyOrderCode()}
        disabled={!orderCode.trim()}
        aria-label={t.confirmation.orderCodeCopied}
      >
        <Copy size={16} />
      </Button>
    </div>
  );

  return (
    <Card
      className={cn(
        "text-left",
        linked && liffIdConfigured
          ? "border-emerald-500/20 bg-emerald-500/[0.04] shadow-none"
          : "overflow-hidden border-border/70 bg-card shadow-soft"
      )}
    >
      <CardContent className="space-y-5 p-6 sm:p-7">
        {orderNumberBlock}

        <div className={cn("border-t pt-5", dividerClass)}>{timeline}</div>

        {liffIdConfigured && linked ? (
          <div className={cn("flex items-start gap-3 border-t pt-5", dividerClass)}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600">
              <Check size={20} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">{t.confirmation.connectLineSuccess}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t.confirmation.connectLineSuccessDetail}</p>
            </div>
          </div>
        ) : null}

        {liffIdConfigured && !linked ? (
          <div className={cn("flex flex-col gap-4 border-t pt-5 sm:flex-row sm:items-center sm:justify-between", dividerClass)}>
            <div className="space-y-2">
              <span className="inline-flex w-fit rounded-full bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
                {t.confirmation.connectLineRecommended}
              </span>
              <p className="text-base font-semibold text-foreground">{t.confirmation.connectLineUpdatesTitle}</p>
              <p className="text-sm text-muted-foreground">{t.confirmation.connectLineShort}</p>
            </div>

            <Button
              type="button"
              className={cn(
                "h-12 w-full shrink-0 gap-2 bg-[#06C755] px-8 text-base font-semibold text-white hover:bg-[#05b34c] sm:h-14 sm:w-auto sm:min-w-[11rem]"
              )}
              onClick={() => void handleConnect()}
              disabled={connecting || !orderCode.trim()}
            >
              <Image
                src="/line-app-icon.png"
                alt=""
                width={24}
                height={24}
                className="size-6 shrink-0 rounded-md"
                aria-hidden
              />
              {connecting ? t.confirmation.connectLineConnecting : t.confirmation.connectLineCta}
            </Button>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
