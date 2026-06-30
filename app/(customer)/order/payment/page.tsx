"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { CashPaymentBlockedDialog } from "@/components/customer/CashPaymentBlockedDialog";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { OrderStepIndicator } from "@/components/customer/OrderStepIndicator";
import { OrderStepNavigation } from "@/components/customer/OrderStepNavigation";
import { PaymentDetailsCard } from "@/components/customer/PaymentDetailsCard";
import { PaymentDiscountSection } from "@/components/customer/PaymentDiscountSection";
import { PaymentMethodSection } from "@/components/customer/PaymentMethodSection";
import { PaymentSlipUpload } from "@/components/customer/PaymentSlipUpload";
import { PaymentTotalSummary } from "@/components/customer/PaymentTotalSummary";
import { WelcomeGiftCard } from "@/components/customer/WelcomeGiftCard";
import type { AppliedDiscount } from "@/components/customer/DiscountCodeField";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  getStoredLineProfile,
  startPaymentLineConnect,
  useLiff
} from "@/components/line/LiffProvider";
import {
  applyLineProfileToCustomer,
  resolveLineProfile
} from "@/lib/line/customer-fields";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { isCashPaymentBlocked, resolvePaymentMethod } from "@/lib/payment";
import { loadReturnMethodState } from "@/lib/return-method";
import { pageTitle, stepEyebrow } from "@/lib/typography";
import { loadDraft, saveDraft } from "@/lib/storage";
import {
  isWelcomeCouponCode,
  isWelcomeGiftPlaceholder,
  WELCOME_COUPON_DISCOUNT_VALUE,
  WELCOME_GIFT_PLACEHOLDER_CODE
} from "@/lib/customer-coupons";
import { fetchWelcomeCoupon, fetchWelcomePromoEligibility, validateDiscountCode } from "@/lib/customer/api";
import type { CustomerDraft, DraftOrder, PaymentInfo, PaymentMethod, ReturnMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

function discountCacheKey(customer: CustomerDraft | undefined) {
  if (!customer) return "";
  return `${customer.lineUserId ?? ""}|${customer.phone}|${customer.email}`;
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <CustomerLayout>
          <OrderStepIndicator current={2}>
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
  const { liffIdConfigured, ready: liffReady, profile } = useLiff();
  const [draft, setDraft] = useState<DraftOrder | null>(null);
  const [returnMethod, setReturnMethod] = useState<ReturnMethod>("pickup");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [paymentSlipDataUrl, setPaymentSlipDataUrl] = useState<string | undefined>();
  const [paymentSlipFileName, setPaymentSlipFileName] = useState<string | undefined>();
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [slipTouched, setSlipTouched] = useState(false);
  const [cashBlockedOpen, setCashBlockedOpen] = useState(false);
  const [welcomeDiscount, setWelcomeDiscount] = useState<AppliedDiscount | null>(null);
  const [manualDiscount, setManualDiscount] = useState<AppliedDiscount | null>(null);
  const [promoEligible, setPromoEligible] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [discountsLoading, setDiscountsLoading] = useState(false);
  const discountCacheRef = useRef<string | null>(null);
  const connectLineHandledRef = useRef(false);

  const lineConnected = Boolean(
    resolveLineProfile(profile ?? getStoredLineProfile(), draft?.customer)?.userId
  );

  const welcomeActive =
    Boolean(welcomeDiscount) || (lineConnected && promoEligible && !discountsLoading);
  const welcomeForSummary: AppliedDiscount | null =
    welcomeDiscount ??
    (welcomeActive
      ? { code: WELCOME_GIFT_PLACEHOLDER_CODE, amount: WELCOME_COUPON_DISCOUNT_VALUE }
      : null);
  const showWelcomeClaim = promoEligible && !welcomeActive && liffIdConfigured && !lineConnected;
  const summaryDiscount = welcomeDiscount ?? manualDiscount ?? welcomeForSummary;

  const refreshDiscounts = useCallback(async (customer: CustomerDraft | undefined, force = false) => {
    const cacheKey = discountCacheKey(customer);
    if (!force && cacheKey && cacheKey === discountCacheRef.current) return;

    if (!customer) {
      discountCacheRef.current = cacheKey;
      setWelcomeDiscount(null);
      setPromoEligible(false);
      setDiscountsLoading(false);
      return;
    }

    setDiscountsLoading(true);

    try {
      const welcomePromise = customer.lineUserId
        ? fetchWelcomeCoupon({
            lineUserId: customer.lineUserId,
            phone: customer.phone,
            email: customer.email,
            ensure: true
          })
        : Promise.resolve(null);

      const [eligibility, welcome] = await Promise.all([
        fetchWelcomePromoEligibility({
          lineUserId: customer.lineUserId,
          phone: customer.phone,
          email: customer.email
        }),
        welcomePromise
      ]);

      discountCacheRef.current = cacheKey;
      setPromoEligible(eligibility.eligible);

      if (welcome?.valid) {
        setWelcomeDiscount({ code: welcome.code, amount: welcome.discountValue });
        setManualDiscount(null);
      } else {
        setWelcomeDiscount(null);
      }
    } catch (error) {
      console.error("[PaymentPage] refreshDiscounts failed", error);
      discountCacheRef.current = cacheKey;
      setWelcomeDiscount(null);
      setPromoEligible(false);
    } finally {
      setDiscountsLoading(false);
    }
  }, []);

  const resolvePersistedDiscount = useCallback(
    async (customer: CustomerDraft | undefined): Promise<AppliedDiscount | null> => {
      if (welcomeDiscount && !isWelcomeGiftPlaceholder(welcomeDiscount.code)) {
        return welcomeDiscount;
      }
      if (manualDiscount) return manualDiscount;

      if (customer?.lineUserId && promoEligible) {
        const welcome = await fetchWelcomeCoupon({
          lineUserId: customer.lineUserId,
          phone: customer.phone,
          email: customer.email,
          ensure: true
        });
        if (welcome.valid) {
          return { code: welcome.code, amount: welcome.discountValue };
        }
      }

      return null;
    },
    [manualDiscount, promoEligible, welcomeDiscount]
  );

  useEffect(() => {
    const loaded = loadDraft();
    if (!loaded.rolls?.length) {
      router.replace("/order/film-rolls");
      return;
    }
    if (!loaded.delivery) {
      router.replace("/order/film-rolls");
      return;
    }

    const baseCustomer = loaded.customer ?? { name: "", phone: "", email: "" };
    const { returnMethod: method } = loadReturnMethodState(loaded);
    const resolvedMethod = resolvePaymentMethod(method, loaded.payment?.method);
    const lineProfile = resolveLineProfile(getStoredLineProfile(), baseCustomer);
    const customerWithLine = lineProfile
      ? applyLineProfileToCustomer(baseCustomer, lineProfile)
      : baseCustomer;

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
      const lineProfile = (await startPaymentLineConnect()) ?? profile ?? getStoredLineProfile();
      if (!lineProfile?.userId) return;

      const loaded = loadDraft();
      const baseCustomer = loaded.customer ?? { name: "", phone: "", email: "" };
      const customer = applyLineProfileToCustomer(baseCustomer, lineProfile);
      const nextDraft = { ...loaded, customer };
      saveDraft(nextDraft);
      setDraft(nextDraft);
      discountCacheRef.current = null;
      await refreshDiscounts(customer, true);
    } catch (error) {
      console.error("[PaymentPage] LINE connect failed", error);
      setConnectError(t.payment.connectLineFailed);
    } finally {
      setConnecting(false);
    }
  }, [profile, refreshDiscounts, t.payment.connectLineFailed]);

  useEffect(() => {
    if (!profile?.userId) return;

    setDraft((current) => {
      if (!current?.customer) return current;
      if (current.customer.lineUserId === profile.userId && current.customer.lineConnected) return current;

      const customer = applyLineProfileToCustomer(current.customer, profile);
      const nextDraft = { ...current, customer };
      saveDraft(nextDraft);
      discountCacheRef.current = null;
      void refreshDiscounts(customer, true);
      return nextDraft;
    });
  }, [profile?.userId, refreshDiscounts]);

  useEffect(() => {
    if (!liffReady || searchParams.get("connectLine") !== "1" || !draft || connectLineHandledRef.current) {
      return;
    }

    connectLineHandledRef.current = true;

    if (draft.customer?.lineConnected && draft.customer.lineUserId) {
      void refreshDiscounts(draft.customer, true);
      return;
    }

    void handlePaymentLineConnect();
  }, [draft, handlePaymentLineConnect, liffReady, refreshDiscounts, searchParams]);

  const showSlipError =
    paymentMethod === "bank_transfer" &&
    !paymentSlipDataUrl &&
    (submitAttempted || slipTouched);

  const persistDraftAndContinue = async () => {
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

    const resolvedDiscount = await resolvePersistedDiscount(draft.customer);

    saveDraft({
      ...draft,
      payment,
      discountCode: resolvedDiscount?.code,
      discountAmount: resolvedDiscount?.amount
    });
    router.push("/order/customer-info");
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

    const resolvedDiscount =
      welcomeDiscount && !isWelcomeGiftPlaceholder(welcomeDiscount.code)
        ? welcomeDiscount
        : manualDiscount;

    saveDraft({
      ...draft,
      payment,
      discountCode: resolvedDiscount?.code,
      discountAmount: resolvedDiscount?.amount
    });
    router.push("/order/film-rolls");
  };

  if (!draft) {
    return (
      <CustomerLayout>
        <OrderStepIndicator current={2}>
          <Card className="border-0 bg-card shadow-none">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">{t.payment.loading}</CardContent>
          </Card>
        </OrderStepIndicator>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <OrderStepIndicator current={2}>
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

            <PaymentDiscountSection
              customer={draft.customer}
              welcomeDiscount={welcomeForSummary}
              manualDiscount={manualDiscount}
              onManualDiscountChange={setManualDiscount}
            />

            <PaymentTotalSummary
              rolls={draft.rolls}
              returnMethod={returnMethod}
              appliedDiscount={summaryDiscount}
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
              continueLabel={t.payment.continueToContact}
              onContinue={() => void persistDraftAndContinue()}
            />
          </CardContent>
        </Card>
      </OrderStepIndicator>

      <CashPaymentBlockedDialog
        open={cashBlockedOpen}
        onOpenChange={setCashBlockedOpen}
        onSwitchToBankTransfer={() => setPaymentMethod("bank_transfer")}
      />
    </CustomerLayout>
  );
}
