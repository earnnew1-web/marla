"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  filmFlowCard,
  filmFlowCardContent,
  filmFlowCardHeader,
  filmFlowCardTitle,
  filmFlowNestedInset
} from "@/components/customer/filmFlowStyles";
import {
  RETURN_METHOD_FIELD_ORDER,
  shouldShowReturnFieldError,
  type ReturnMethodFieldKey
} from "@/lib/return-method-validation";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { sectionTitle } from "@/lib/typography";
import type { ReturnMethod, ReturnShippingInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  returnMethod: ReturnMethod;
  returnShipping: ReturnShippingInfo;
  submitAttempted: boolean;
  touchedFields: Set<ReturnMethodFieldKey>;
  onReturnMethodChange: (method: ReturnMethod) => void;
  onShippingChange: (patch: Partial<ReturnShippingInfo>) => void;
  onFieldBlur: (field: ReturnMethodFieldKey) => void;
  registerFieldRef: (field: ReturnMethodFieldKey, element: HTMLElement | null) => void;
};

export function ReturnMethodSection({
  returnMethod,
  returnShipping,
  submitAttempted,
  touchedFields,
  onReturnMethodChange,
  onShippingChange,
  onFieldBlur,
  registerFieldRef
}: Props) {
  const { t } = useCustomerLanguage();

  const showError = (field: ReturnMethodFieldKey) =>
    shouldShowReturnFieldError(returnMethod, returnShipping, field, {
      submitAttempted,
      touched: touchedFields.has(field)
    });

  const setFieldRef = (field: ReturnMethodFieldKey) => (element: HTMLElement | null) => {
    registerFieldRef(field, element);
  };

  return (
    <Card className={filmFlowCard}>
      <CardHeader className={filmFlowCardHeader}>
        <h2 className={filmFlowCardTitle}>{t.filmRolls.returnMethod}</h2>
      </CardHeader>
      <CardContent className={filmFlowCardContent}>
        <RadioGroup
          value={returnMethod}
          onValueChange={(value) => onReturnMethodChange(value as ReturnMethod)}
          className="space-y-2"
        >
          <ReturnMethodOption
            id="return-pickup"
            value="pickup"
            selected={returnMethod === "pickup"}
            label={t.filmRolls.returnMethodPickup}
            price={t.filmRolls.returnMethodPickupPrice}
          />
          <ReturnMethodOption
            id="return-post"
            value="post"
            selected={returnMethod === "post"}
            label={t.filmRolls.returnMethodPost}
            price={t.filmRolls.returnMethodPostPrice}
          />
        </RadioGroup>

        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out",
            returnMethod === "post" ? "mt-1 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className={cn(filmFlowNestedInset, "space-y-4")}>
              {RETURN_METHOD_FIELD_ORDER.map((field) => {
                const labels = {
                  recipientName: t.filmRolls.recipientName,
                  phone: t.filmRolls.recipientPhone,
                  address: t.filmRolls.shippingAddress
                };
                const placeholders = {
                  recipientName: t.filmRolls.recipientNamePlaceholder,
                  phone: t.filmRolls.recipientPhonePlaceholder,
                  address: t.filmRolls.shippingAddressPlaceholder
                };

                return (
                  <ValidationField
                    key={field}
                    label={labels[field]}
                    showError={showError(field)}
                    fieldRef={setFieldRef(field)}
                    onBlur={() => onFieldBlur(field)}
                  >
                    {field === "address" ? (
                      <textarea
                        className={cn(
                          "flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background transition placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                          showError(field) && "border-destructive focus-visible:ring-destructive"
                        )}
                        placeholder={placeholders[field]}
                        value={returnShipping[field]}
                        onChange={(event) => onShippingChange({ [field]: event.target.value })}
                        aria-invalid={showError(field)}
                      />
                    ) : (
                      <Input
                        className={cn("h-11", showError(field) && "border-destructive focus-visible:ring-destructive")}
                        placeholder={placeholders[field]}
                        value={returnShipping[field]}
                        onChange={(event) => onShippingChange({ [field]: event.target.value })}
                        aria-invalid={showError(field)}
                      />
                    )}
                  </ValidationField>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ValidationField({
  label,
  showError,
  fieldRef,
  onBlur,
  children
}: {
  label: string;
  showError: boolean;
  fieldRef: (element: HTMLElement | null) => void;
  onBlur?: () => void;
  children: React.ReactNode;
}) {
  const { t } = useCustomerLanguage();

  return (
    <div ref={fieldRef} tabIndex={-1} onBlur={onBlur} className="space-y-2.5 outline-none">
      <Label className={sectionTitle}>{label}</Label>
      {children}
      {showError ? <p className="text-xs text-destructive/90">{t.common.errors.required}</p> : null}
    </div>
  );
}

function ReturnMethodOption({
  id,
  value,
  selected,
  label,
  price
}: {
  id: string;
  value: ReturnMethod;
  selected: boolean;
  label: string;
  price: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3.5 transition",
        selected
          ? "border-primary/30 bg-primary/[0.04]"
          : "border-border/70 bg-card hover:border-accent/25 hover:bg-accent/[0.03]"
      )}
    >
      <div className="flex items-center gap-3">
        <RadioGroupItem value={value} id={id} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-sm font-semibold tabular-nums text-foreground">{price}</span>
    </label>
  );
}
