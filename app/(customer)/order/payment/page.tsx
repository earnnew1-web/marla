"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CashPaymentBlockedDialog } from "@/components/customer/CashPaymentBlockedDialog";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { OrderStepIndicator } from "@/components/customer/OrderStepIndicator";
import { OrderStepNavigation } from "@/components/customer/OrderStepNavigation";
import { PaymentDetailsCard } from "@/components/customer/PaymentDetailsCard";
import { PaymentMethodSection } from "@/components/customer/PaymentMethodSection";
import { PaymentSlipUpload } from "@/components/customer/PaymentSlipUpload";
import { PaymentTotalSummary } from "@/components/customer/PaymentTotalSummary";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getStoredLineProfile } from "@/components/line/LiffProvider";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { isCashPaymentBlocked, resolvePaymentMethod } from "@/lib/payment";
import { loadReturnMethodState } from "@/lib/return-method";
import { pageTitle, stepEyebrow } from "@/lib/typography";
import { loadDraft, saveDraft, clearDraft } from "@/lib/storage";
import { submitOrder } from "@/lib/customer/api";
import type { DraftOrder, PaymentInfo, PaymentMethod, ReturnMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function PaymentPage() {
  const router = useRouter();
  const { t } = useCustomerLanguage();
  const [draft, setDraft] = useState<DraftOrder | null>(null);
  const [returnMethod, setReturnMethod] = useState<ReturnMethod>("pickup");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [paymentSlipDataUrl, setPaymentSlipDataUrl] = useState<string | undefined>();
  const [paymentSlipFileName, setPaymentSlipFileName] = useState<string | undefined>();
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [slipTouched, setSlipTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cashBlockedOpen, setCashBlockedOpen] = useState(false);

  useEffect(() => {
    const loaded = loadDraft();
    if (!loaded.customer) {
      router.replace("/order/customer-info");
      return;
    }
    if (!loaded.rolls?.length) {
      router.replace("/order/film-rolls");
      return;
    }
    if (!loaded.delivery) {
      router.replace("/order/film-rolls");
      return;
    }

    const { returnMethod: method } = loadReturnMethodState(loaded);
    const resolvedMethod = resolvePaymentMethod(method, loaded.payment?.method);

    setDraft(loaded);
    setReturnMethod(method);
    setPaymentMethod(resolvedMethod);
    setPaymentSlipDataUrl(loaded.payment?.paymentSlipDataUrl);
    setPaymentSlipFileName(loaded.payment?.paymentSlipFileName);
  }, [router]);

  const showSlipError =
    paymentMethod === "bank_transfer" &&
    !paymentSlipDataUrl &&
    (submitAttempted || slipTouched);

  const confirmOrder = async () => {
    if (!draft) return;

    setSubmitAttempted(true);

    if (paymentMethod === "cash" && isCashPaymentBlocked(returnMethod)) {
      setCashBlockedOpen(true);
      return;
    }

    if (paymentMethod === "bank_transfer" && !paymentSlipDataUrl) {
      return;
    }

    const payment: PaymentInfo = {
      method: paymentMethod,
      ...(paymentMethod === "bank_transfer"
        ? {
            paymentSlipDataUrl,
            paymentSlipFileName
          }
        : {})
    };

    const profile = getStoredLineProfile();
    const customer = draft.customer
      ? {
          ...draft.customer,
          lineUserId: profile?.userId ?? draft.customer.lineUserId ?? null,
          lineDisplayName: profile?.displayName ?? draft.customer.lineDisplayName ?? null,
          linePictureUrl: profile?.pictureUrl ?? draft.customer.linePictureUrl ?? null,
          lineConnected: Boolean(profile?.userId ?? draft.customer.lineUserId)
        }
      : draft.customer;

    const nextDraft: DraftOrder = { ...draft, customer, payment };
    saveDraft(nextDraft);
    setSubmitting(true);

    try {
      const { order } = await submitOrder(nextDraft);
      localStorage.setItem("mfl:last-order-code", order.orderCode);
      clearDraft();
      router.push(`/order/confirmation?code=${encodeURIComponent(order.orderCode)}`);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : t.payment.submitFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (!draft) {
      router.push("/order/film-rolls");
      return;
    }

    const payment: PaymentInfo = {
      method: paymentMethod,
      ...(paymentMethod === "bank_transfer" && paymentSlipDataUrl
        ? {
            paymentSlipDataUrl,
            paymentSlipFileName
          }
        : {})
    };

    saveDraft({ ...draft, payment });
    router.push("/order/film-rolls");
  };

  if (!draft) {
    return (
      <CustomerLayout>
        <OrderStepIndicator current={3}>
          <Card className="border-0 bg-card shadow-none">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">{t.payment.loading}</CardContent>
          </Card>
        </OrderStepIndicator>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <OrderStepIndicator current={3}>
        <Card className="border-0 bg-card shadow-none">
          <CardHeader className="p-5 sm:p-7">
            <p className={stepEyebrow}>{t.payment.step}</p>
            <h1 className={cn("mt-2", pageTitle)}>{t.payment.title}</h1>
            <p className="mt-2 text-muted-foreground">{t.payment.subtitle}</p>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0 sm:px-7 sm:pb-7">
            <PaymentTotalSummary rolls={draft.rolls} returnMethod={returnMethod} />

            <PaymentMethodSection
              paymentMethod={paymentMethod}
              onChange={(method) => {
                setPaymentMethod(method);
                if (method === "cash") {
                  setPaymentSlipDataUrl(undefined);
                  setPaymentSlipFileName(undefined);
                }
              }}
            />

            {paymentMethod === "bank_transfer" ? (
              <>
                <PaymentDetailsCard />
                <PaymentSlipUpload
                  dataUrl={paymentSlipDataUrl}
                  fileName={paymentSlipFileName}
                  showError={showSlipError}
                  onUpload={(dataUrl, fileName) => {
                    setPaymentSlipDataUrl(dataUrl);
                    setPaymentSlipFileName(fileName);
                  }}
                  onRemove={() => {
                    setPaymentSlipDataUrl(undefined);
                    setPaymentSlipFileName(undefined);
                  }}
                  onInteract={() => setSlipTouched(true)}
                />
              </>
            ) : null}

            <OrderStepNavigation
              onBack={goBack}
              continueLabel={submitting ? t.payment.submitting : t.payment.confirmOrder}
              onContinue={confirmOrder}
              continueDisabled={submitting}
              continueLoading={submitting}
            />
          </CardContent>
        </Card>
      </OrderStepIndicator>

      <CashPaymentBlockedDialog
        open={cashBlockedOpen}
        onOpenChange={setCashBlockedOpen}
        onSwitchToBankTransfer={() => setPaymentMethod("bank_transfer")}
      />

      {submitting ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 px-4 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-border/70 bg-card px-6 py-8 text-center shadow-lg">
            <Loader2 className="h-9 w-9 animate-spin text-accent" />
            <p className="text-base font-bold">{t.payment.submitting}</p>
            <p className="text-sm text-muted-foreground">{t.payment.submittingDetail}</p>
          </div>
        </div>
      ) : null}
    </CustomerLayout>
  );
}
