"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  filmFlowCard,
  filmFlowCardContent,
  filmFlowCardHeader,
  filmFlowCardTitle
} from "@/components/customer/filmFlowStyles";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import type { PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  paymentMethod: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
};

export function PaymentMethodSection({ paymentMethod, onChange }: Props) {
  const { t } = useCustomerLanguage();

  return (
    <Card className={filmFlowCard}>
      <CardHeader className={filmFlowCardHeader}>
        <h2 className={filmFlowCardTitle}>{t.payment.methodTitle}</h2>
      </CardHeader>
      <CardContent className={filmFlowCardContent}>
        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) => onChange(value as PaymentMethod)}
          className="space-y-2"
        >
          <PaymentOption
            id="payment-bank"
            value="bank_transfer"
            selected={paymentMethod === "bank_transfer"}
            label={t.payment.bankTitle}
          />
          <PaymentOption
            id="payment-cash"
            value="cash"
            selected={paymentMethod === "cash"}
            label={t.payment.cashTitle}
            helper={t.payment.cashWarning}
            helperClassName="text-destructive/90"
          />
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

function PaymentOption({
  id,
  value,
  selected,
  label,
  helper,
  helperClassName
}: {
  id: string;
  value: PaymentMethod;
  selected: boolean;
  label: string;
  helper?: string;
  helperClassName?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer flex-col rounded-xl border px-4 py-3.5 transition",
        selected
          ? "border-primary/30 bg-primary/[0.04]"
          : "border-border/70 bg-card hover:border-accent/25 hover:bg-accent/[0.03]"
      )}
    >
      <div className="flex items-center gap-3">
        <RadioGroupItem value={value} id={id} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {helper ? (
        <p className={cn("mt-2 pl-7 text-xs leading-relaxed", helperClassName ?? "text-muted-foreground")}>
          {helper}
        </p>
      ) : null}
    </label>
  );
}
