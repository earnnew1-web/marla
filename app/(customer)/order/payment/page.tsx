"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
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
import { WelcomeGiftCard } from "@/components/customer/WelcomeGiftCard";
import type { AppliedDiscount } from "@/components/customer/DiscountCodeField";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  getStoredLineProfile,
  refreshLineProfile,
  startPaymentLineConnect,
  useLiff
} from "@/components/line/LiffProvider";
import {
  applyLineProfileToCustomer,
  buildLineSubmitPayload,
  resolveLineProfile
} from "@/lib/line/customer-fields";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { isCashPaymentBlocked, resolvePaymentMethod } from "@/lib/payment";
import { loadReturnMethodState } from "@/lib/return-method";
import { pageTitle, stepEyebrow } from "@/lib/typography";
import { loadDraft, saveDraft, clearDraft } from "@/lib/storage";
import { isWelcomeCouponCode, WELCOME_COUPON_DISCOUNT_VALUE } from "@/lib/customer-coupons";
import { fetchWelcomeCoupon, fetchWelcomePromoEligibility, submitOrder, validateDiscountCode } from "@/lib/customer/api";
import type { CustomerDraft, DraftOrder, PaymentInfo, PaymentMethod, ReturnMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <CustomerLayout>
          <OrderStepIndicator current={3}>
            <Card className="border-0 bg-card shadow-none">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">Loading...</CardContent>
            </Card>
          </OrderStepIndicator>
        </CustomerLayout>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useCustomerLanguage();
  const { liffIdConfigured, ready: liffReady } = useLiff();
  const [draft, setDraft] = useState<DraftOrder | null>(null);
  const [returnMethod, setReturnMethod] = useState<ReturnMethod>("pickup");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [paymentSlipDataUrl, setPaymentSlipDataUrl] = useState<string | undefined>();
  const [paymentSlipFileName, setPaymentSlipFileName] = useState<string | undefined>();
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [slipTouched, setSlipTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cashBlockedOpen, setCashBlockedOpen] = useState(false);
  const [welcomeDiscount, setWelcomeDiscount] = useState<AppliedDiscount | null>(null);
  const [manualDiscount, setManualDiscount] = useState<AppliedDiscount | null>(null);
  const [promoEligible, setPromoEligible] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [discountsReady, setDiscountsReady] = useState(false);

  const lineConnected = Boolean(draft?.customer?.lineConnected && draft?.customer?.lineUserId);
  const welcomeActive =
    Boolean(welcomeDiscount) || (discountsReady && lineConnected && promoEligible);
  const welcomeForSummary: AppliedDiscount | null =
    welcomeDiscount ??
    (welcomeActive ? { code: "WELCOME-GIFT", amount: WELCOME_COUPON_DISCOUNT_VALUE } : null);
  const pricingDiscount = welcomeForSummary ?? manualDiscount;
  const showWelcomeClaim = promoEligible && !welcomeActive && liffIdConfigured && !lineConnected;

  const resolveDiscountForSubmit = useCallback(
    async (customer: CustomerDraft) => {
      if (welcomeDiscount) return welcomeDiscount;
      if (manualDiscount) return manualDiscount;
      if (!lineConnected || !promoEligible || !customer.lineUserId) return null;

      const welcome = await fetchWelcomeCoupon({
        lineUserId: customer.lineUserId,
        phone: customer.phone,
        email: customer.email,
        ensure: true
      });

      if (welcome.valid) {
        return { code: welcome.code, amount: welcome.discountValue };
      }

      return null;
    },
    [lineConnected, manualDiscount, promoEligible, welcomeDiscount]
  );

  const refreshDiscounts = useCallback(async (customer: CustomerDraft | undefined) => {
    if (!customer) {
      setWelcomeDiscount(null);
      setPromoEligible(false);
      setDiscountsReady(true);
      return;
    }

    try {
      const eligibility = await fetchWelcomePromoEligibility({
        lineUserId: customer.lineUserId,
        phone: customer.phone,
        email: customer.email
      });
      setPromoEligible(eligibility.eligible);

      if (customer.lineUserId) {
        const welcome = await fetchWelcomeCoupon({
          lineUserId: customer.lineUserId,
          phone: customer.phone,
          email: customer.email,
          ensure: true
        });

        if (welcome.valid) {
          setWelcomeDiscount({ code: welcome.code, amount: welcome.discountValue });
          setManualDiscount(null);
        } else {
          setWelcomeDiscount(null);
        }
      } else {
        setWelcomeDiscount(null);
      }
    } catch (error) {
      console.error("[PaymentPage] refreshDiscounts failed", error);
      setWelcomeDiscount(null);
    } finally {
      setDiscountsReady(true);
    }
  }, []);

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
    const lineProfile = resolveLineProfile(getStoredLineProfile(), loaded.customer);
    const customerWithLine = lineProfile
      ? applyLineProfileToCustomer(loaded.customer, lineProfile)
      : loaded.customer;

    setDraft({ ...loaded, customer: customerWithLine });
    setReturnMethod(method);
    setPaymentMethod(resolvedMethod);
    setPaymentSlipDataUrl(loaded.payment?.paymentSlipDataUrl);
    setPaymentSlipFileName(loaded.payment?.paymentSlipFileName);

    void refreshDiscounts(customerWithLine);

    if (loaded.discountCode?.trim() && customerWithLine && !isWelcomeCouponCode(loaded.discountCode)) {
      void validateDiscountCode({
        code: loaded.discountCode,
        lineUserId: customerWithLine.lineUserId,
        phone: customerWithLine.phone,
        email: customerWithLine.email
      }).then((result) => {
        if (result.valid && result.code && result.discountValue) {
          setManualDiscount({ code: result.code, amount: result.discountValue });
        }
      });
    }
  }, [router, refreshDiscounts]);

  const handlePaymentLineConnect = useCallback(async () => {
    setConnecting(true);
    setConnectError(null);

    try {
      const profile = await startPaymentLineConnect();
      if (!profile) return;

      setDraft((current) => {
        if (!current?.customer) return current;
        const customer = applyLineProfileToCustomer(current.customer, profile);
        const nextDraft = { ...current, customer };
        saveDraft(nextDraft);
        void refreshDiscounts(customer);
        return nextDraft;
      });
    } catch (error) {
      console.error("[PaymentPage] LINE connect failed", error);
      setConnectError(t.payment.connectLineFailed);
    } finally {
      setConnecting(false);
    }
  }, [refreshDiscounts, t.payment.connectLineFailed]);

  useEffect(() => {
    if (!liffReady || searchParams.get("connectLine") !== "1" || !draft?.customer) return;
    if (draft.customer.lineConnected && draft.customer.lineUserId) {
      void refreshDiscounts(draft.customer);
      return;
    }

    void handlePaymentLineConnect();
  }, [draft?.customer, handlePaymentLineConnect, liffReady, refreshDiscounts, searchParams]);

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

    const profile = await refreshLineProfile();
    const activeProfile = profile ?? resolveLineProfile(getStoredLineProfile(), draft.customer);
    const customer = draft.customer
      ? applyLineProfileToCustomer(draft.customer, activeProfile)
      : draft.customer;

    console.log("[Submit] line payload", customer ? buildLineSubmitPayload(customer) : null);

    const resolvedDiscount = customer ? await resolveDiscountForSubmit(customer) : null;

    const nextDraft: DraftOrder = {
      ...draft,
      customer,
      payment,
      discountCode: resolvedDiscount?.code
    };
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

    saveDraft({ ...draft, payment, discountCode: welcomeDiscount?.code ?? manualDiscount?.code });
    router.push("/order/film-rolls");
  };

  if (!draft || !discountsReady) {
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
          <CardContent className="space-y-8 p-5 pt-0 sm:px-7 sm:pb-7">
            <WelcomeGiftCard
              applied={welcomeActive}
              showClaim={showWelcomeClaim}
              connecting={connecting}
              connectError={connectError}
              onConnectLine={() => void handlePaymentLineConnect()}
            />

            <PaymentTotalSummary
              rolls={draft.rolls}
              returnMethod={returnMethod}
              customer={draft.customer}
              welcomeDiscount={welcomeForSummary}
              manualDiscount={manualDiscount}
              onManualDiscountChange={setManualDiscount}
            />

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
