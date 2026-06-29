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
  className
}: Props) {
  const { t } = useCustomerLanguage();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appliedDiscount) {
      setInput("");
    }
  }, [appliedDiscount]);

  const applyCode = async () => {
    const code = input.trim();
    if (!code) return;

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
        setError(mapErrorCode(t, result.errorCode));
        return;
      }

      onApplied({ code: result.code, amount: result.discountValue });
      setInput("");
      setError(null);
    } catch (applyError) {
      onApplied(null);
      setError(applyError instanceof Error ? applyError.message : t.payment.discountInvalid);
    } finally {
      setLoading(false);
    }
  };

  const clearCode = () => {
    setInput("");
    setError(null);
    onApplied(null);
  };

  if (appliedDiscount) {
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3",
          className
        )}
      >
        <div className="min-w-0">
          <p className="truncate font-semibold text-emerald-800">{appliedDiscount.code}</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm font-medium text-emerald-700">
            <Check size={14} className="shrink-0" />
            {t.payment.discountAppliedSuccess}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onClick={clearCode}
          aria-label={t.payment.discountRemove}
        >
          <X size={16} />
        </Button>
      </div>
    );
  }

  const canApply = Boolean(input.trim()) && !loading;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <Input
          id="discount-code"
          value={input}
          onChange={(event) => {
            setInput(event.target.value.toUpperCase());
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canApply) {
              event.preventDefault();
              void applyCode();
            }
          }}
          placeholder={t.payment.discountCodePlaceholder}
          disabled={loading}
          className="h-11 uppercase"
          aria-invalid={Boolean(error)}
        />
        <Button
          type="button"
          className="h-11 min-w-[5.5rem] shrink-0 px-4"
          onClick={() => void applyCode()}
          disabled={!canApply}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.payment.discountApply}
        </Button>
      </div>
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
