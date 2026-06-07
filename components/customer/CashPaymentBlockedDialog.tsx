"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { cardTitle } from "@/lib/typography";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToBankTransfer: () => void;
};

export function CashPaymentBlockedDialog({ open, onOpenChange, onSwitchToBankTransfer }: Props) {
  const { t } = useCustomerLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className={cardTitle}>{t.payment.cashBlockedTitle}</DialogTitle>
          <DialogDescription className="whitespace-pre-line">{t.payment.cashBlockedBody}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            onClick={() => {
              onSwitchToBankTransfer();
              onOpenChange(false);
            }}
          >
            {t.payment.cashBlockedAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
