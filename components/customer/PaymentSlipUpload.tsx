"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  filmFlowCard,
  filmFlowCardContent,
  filmFlowCardHeader,
  filmFlowCardTitle,
  filmFlowNestedInset
} from "@/components/customer/filmFlowStyles";
import { PAYMENT_SLIP_ACCEPT } from "@/lib/payment";
import { compressPaymentSlipFile } from "@/lib/payment-slip";
import { VALIDATION_MESSAGE } from "@/lib/film-roll-validation";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { cn } from "@/lib/utils";

type Props = {
  dataUrl?: string;
  fileName?: string;
  showError: boolean;
  onUpload: (dataUrl: string, fileName: string) => void;
  onRemove: () => void;
  onInteract: () => void;
};

export function PaymentSlipUpload({
  dataUrl,
  fileName,
  showError,
  onUpload,
  onRemove,
  onInteract
}: Props) {
  const { t } = useCustomerLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file || processing) return;
    onInteract();
    setProcessing(true);

    try {
      const { dataUrl: compressed, fileName: nextFileName } = await compressPaymentSlipFile(file);
      onUpload(compressed, nextFileName);
    } catch {
      onInteract();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className={filmFlowCard}>
      <CardHeader className={filmFlowCardHeader}>
        <h2 className={filmFlowCardTitle}>{t.payment.slipTitle}</h2>
      </CardHeader>
      <CardContent className={filmFlowCardContent}>
        <input
          ref={inputRef}
          type="file"
          accept={PAYMENT_SLIP_ACCEPT}
          className="hidden"
          disabled={processing}
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        {processing ? (
          <div className="flex min-h-36 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-6">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <span className="text-sm font-semibold text-muted-foreground">{t.payment.slipProcessing}</span>
          </div>
        ) : dataUrl ? (
          <div className={cn(filmFlowNestedInset, "space-y-3")}>
            <div className="relative overflow-hidden rounded-lg border border-border/60 bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={dataUrl} alt={fileName ?? t.payment.slipTitle} className="max-h-64 w-full object-contain" />
              <button
                type="button"
                onClick={onRemove}
                className="absolute right-2 top-2 rounded-full border border-border/70 bg-card/95 p-1.5 text-muted-foreground shadow-sm transition hover:text-foreground"
                aria-label={t.payment.removeSlip}
              >
                <X size={14} />
              </button>
            </div>
            {fileName ? <p className="truncate text-xs text-muted-foreground">{fileName}</p> : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              onInteract();
              inputRef.current?.click();
            }}
            className={cn(
              "flex min-h-36 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-4 py-6 text-center transition",
              showError
                ? "border-destructive/50 bg-destructive/[0.03]"
                : "border-border/80 bg-muted/20 hover:border-accent/35 hover:bg-accent/[0.04]"
            )}
          >
            <ImagePlus size={24} className="text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">{t.payment.slipPlaceholder}</span>
          </button>
        )}

        {showError ? <p className="text-xs text-destructive/90">{VALIDATION_MESSAGE}</p> : null}
      </CardContent>
    </Card>
  );
}
