"use client";

import { Button } from "@/components/ui/button";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { cn } from "@/lib/utils";

type Props = {
  showBack?: boolean;
  onBack?: () => void;
  continueLabel: string;
  onContinue?: () => void;
  continueType?: "button" | "submit";
  continueDisabled?: boolean;
  continueLoading?: boolean;
};

export function OrderStepNavigation({
  showBack = true,
  onBack,
  continueLabel,
  onContinue,
  continueType = "button",
  continueDisabled = false,
  continueLoading = false
}: Props) {
  const { t } = useCustomerLanguage();

  return (
    <div
      className={cn(
        "flex gap-3",
        showBack ? "flex-col sm:flex-row sm:items-center sm:justify-between" : "flex-col"
      )}
    >
      {showBack ? (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full sm:w-auto sm:min-w-[7.5rem]"
          onClick={onBack}
        >
          {t.steps.back}
        </Button>
      ) : null}
      <Button
        type={continueType}
        className={cn("h-11", showBack ? "w-full sm:ml-auto sm:w-auto sm:min-w-[9rem]" : "w-full")}
        disabled={continueDisabled || continueLoading}
        onClick={continueType === "button" ? onContinue : undefined}
      >
        {continueLabel}
      </Button>
    </div>
  );
}
