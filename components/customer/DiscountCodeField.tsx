"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateDiscountCode } from "@/lib/customer/api";
import type { DiscountErrorCode } from "@/lib/discount-errors";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import type { CustomerDraft } from "@/lib/types";
import { cn } from "@/lib/utils";

export type AppliedDiscount = {
  code: string;
  amount: number;
};

type Props = {
  customer?: CustomerDraft;
  appliedDiscount: AppliedDiscount | null;
  onApplied: (discount: AppliedDiscount | null) => void;
  locked?: boolean;
  appliedMessage?: string;
  className?: string;
};

function mapErrorCode(t: ReturnType<typeof useCustomerLanguage>["t"], errorCode?: DiscountErrorCode) {
  switch (errorCode) {
    case "expired":
      return t.payment.discountExpired;
    case "already_used":
      return t.payment.discountAlreadyUsed;
    case "not_eligible":
      return t.payment.discountNotEligible;
    case "invalid":
    default:
      return t.payment.discountInvalid;
  }
}

export function DiscountCodeField({
  customer,
  appliedDiscount,
  onApplied,
  locked = false,
  appliedMessage,
  className
}: Props) {
  const { t } = useCustomerLanguage();
  const [input, setInput] = useState(appliedDiscount?.code ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(Boolean(appliedDiscount));

  useEffect(() => {
    setInput(appliedDiscount?.code ?? "");
    setShowSuccessBanner(Boolean(appliedDiscount));
  }, [appliedDiscount?.code, appliedDiscount]);

  const applyCode = async () => {
    const code = input.trim();
    if (!code || locked) return;

    setLoading(true);
    setError(null);

    try {
      const result = await validateDiscountCode({
        code,
        lineUserId: customer?.lineUserId,
        phone: customer?.phone,
        email: customer?.email
      });

      if (!result.valid || !result.code || !result.discountValue) {
        onApplied(null);
        setShowSuccessBanner(false);
        setError(mapErrorCode(t, result.errorCode));
        return;
      }

      onApplied({ code: result.code, amount: result.discountValue });
      setInput(result.code);
      setShowSuccessBanner(true);
      setError(null);
    } catch (applyError) {
      onApplied(null);
      setShowSuccessBanner(false);
      setError(applyError instanceof Error ? applyError.message : t.payment.discountInvalid);
    } finally {
      setLoading(false);
    }
  };

  const clearCode = () => {
    if (locked) return;
    setInput("");
    setError(null);
    setShowSuccessBanner(false);
    onApplied(null);
  };

  const dismissBanner = () => {
    if (locked) return;
    setShowSuccessBanner(false);
    clearCode();
  };

  const canApply = Boolean(input.trim()) && !loading && !locked;
  const displayCode = appliedDiscount?.code ?? input.trim();
  const successText =
    appliedMessage ??
    (displayCode ? t.payment.discountCodeApplied.replace("{code}", displayCode) : t.payment.discountAppliedSuccess);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            id="discount-code"
            value={locked && appliedDiscount ? appliedDiscount.code : input}
            onChange={(event) => {
              if (locked) return;
              setInput(event.target.value.toUpperCase());
              if (error) setError(null);
              if (showSuccessBanner) setShowSuccessBanner(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && canApply) {
                event.preventDefault();
                void applyCode();
              }
            }}
            placeholder={t.payment.discountCodePlaceholder}
            disabled={loading || locked}
            readOnly={locked}
            className="h-11 pr-9 uppercase"
            aria-invalid={Boolean(error)}
          />
          {(input || (locked && appliedDiscount)) && !locked ? (
            <button
              type="button"
              onClick={clearCode}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground transition hover:text-foreground"
              aria-label={t.payment.discountRemove}
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
        <Button
          type="button"
          className="h-11 min-w-[5.5rem] shrink-0 px-4"
          onClick={() => void applyCode()}
          disabled={!canApply}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.payment.discountApply}
        </Button>
      </div>

      {showSuccessBanner && appliedDiscount ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3">
          <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-emerald-700">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
              <Check size={12} strokeWidth={3} />
            </span>
            <span className="truncate">{successText}</span>
          </p>
          {!locked ? (
            <button
              type="button"
              onClick={dismissBanner}
              className="shrink-0 rounded p-0.5 text-emerald-700/70 transition hover:text-emerald-900"
              aria-label={t.payment.discountRemove}
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
