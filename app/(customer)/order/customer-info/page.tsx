"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { LineDebugPanel } from "@/components/line/LineDebugPanel";
import { OrderStepIndicator } from "@/components/customer/OrderStepIndicator";
import { OrderStepNavigation } from "@/components/customer/OrderStepNavigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStoredLineProfile, refreshLineProfile, useLiff } from "@/components/line/LiffProvider";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { fetchWelcomeCoupon, submitOrder } from "@/lib/customer/api";
import { isWelcomeCouponCode, isWelcomeGiftPlaceholder } from "@/lib/customer-coupons";
import { orderRequiresCustomerEmail } from "@/lib/film-pricing";
import { applyLineProfileToCustomer, buildLineSubmitPayload, resolveLineProfile } from "@/lib/line/customer-fields";
import { pageTitle, stepEyebrow } from "@/lib/typography";
import { clearDraft, loadDraft, saveDraft } from "@/lib/storage";
import { cn } from "@/lib/utils";

type CustomerForm = {
  name: string;
  phone: string;
  lineId: string;
  email: string;
  allowSocialShare: boolean;
  instagramUsername: string;
};

const emptyForm = (): CustomerForm => ({
  name: "",
  phone: "",
  lineId: "",
  email: "",
  allowSocialShare: true,
  instagramUsername: ""
});

export default function CustomerInfoPage() {
  return <CustomerInfoContent />;
}

function CustomerInfoContent() {
  const router = useRouter();
  const { t } = useCustomerLanguage();
  const { inLine, profile } = useLiff();
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [emailRequired, setEmailRequired] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    if (!draft.rolls?.length) {
      router.replace("/order/film-rolls");
      return;
    }
    if (!draft.delivery) {
      router.replace("/order/film-rolls");
      return;
    }
    if (!draft.payment) {
      router.replace("/order/payment");
      return;
    }

    setEmailRequired(orderRequiresCustomerEmail(draft.rolls ?? []));

    if (draft.customer) {
      setForm({
        name: draft.customer.name,
        phone: draft.customer.phone,
        lineId: draft.customer.lineId ?? "",
        email: draft.customer.email ?? "",
        allowSocialShare: draft.customer.allowSocialShare ?? true,
        instagramUsername: draft.customer.instagramUsername ?? ""
      });
    }
  }, [router]);

  useEffect(() => {
    if (!profile?.userId) return;

    const draft = loadDraft();
    const nextCustomer = applyLineProfileToCustomer(
      draft.customer ?? { name: "", phone: "", email: "" },
      profile
    );
    saveDraft({
      ...draft,
      customer: nextCustomer
    });
    setForm((current) => ({
      ...current,
      name: nextCustomer.name || current.name,
      phone: nextCustomer.phone || current.phone,
      lineId: nextCustomer.lineId ?? current.lineId,
      email: nextCustomer.email ?? current.email
    }));
  }, [profile]);

  const goBack = () => {
    const draft = loadDraft();
    const baseCustomer = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      lineId: form.lineId.trim(),
      email: emailRequired ? form.email.trim() : "",
      allowSocialShare: form.allowSocialShare,
      instagramUsername:
        form.allowSocialShare && form.instagramUsername.trim() ? form.instagramUsername.trim() : null,
      lineUserId: draft.customer?.lineUserId,
      lineDisplayName: draft.customer?.lineDisplayName,
      linePictureUrl: draft.customer?.linePictureUrl,
      lineConnected: draft.customer?.lineConnected
    };
    saveDraft({ ...draft, customer: baseCustomer });
    router.push("/order/payment");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = t.customerInfo.errors.name;
    if (!form.phone.trim()) nextErrors.phone = t.customerInfo.errors.phone;
    if (!form.lineId.trim()) nextErrors.lineId = t.customerInfo.errors.lineId;
    if (emailRequired && !form.email.trim()) nextErrors.email = t.customerInfo.errors.email;
    if (form.allowSocialShare && !form.instagramUsername.trim()) {
      nextErrors.instagram = t.customerInfo.errors.instagram;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const messages = Object.values(nextErrors);
      toast.error(messages[0], {
        description: messages.length > 1 ? messages.slice(1).join(" · ") : undefined
      });
      return;
    }

    setSubmitting(true);
    try {
      const draft = loadDraft();
      if (!draft.payment) {
        router.replace("/order/payment");
        return;
      }
      if (draft.payment.method === "bank_transfer" && !draft.payment.paymentSlipDataUrl) {
        toast.error(t.payment.slipRequired);
        router.push("/order/payment");
        return;
      }

      let activeProfile = resolveLineProfile(profile ?? getStoredLineProfile());
      if (inLine && !activeProfile?.userId) {
        activeProfile = await refreshLineProfile();
      }

      const baseCustomer = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        lineId: form.lineId.trim(),
        email: emailRequired ? form.email.trim() : "",
        allowSocialShare: form.allowSocialShare,
        instagramUsername:
          form.allowSocialShare && form.instagramUsername.trim() ? form.instagramUsername.trim() : null,
        lineUserId: draft.customer?.lineUserId,
        lineDisplayName: draft.customer?.lineDisplayName,
        linePictureUrl: draft.customer?.linePictureUrl,
        lineConnected: draft.customer?.lineConnected
      };
      const customer = applyLineProfileToCustomer(baseCustomer, activeProfile);

      console.log("[Submit] line payload", buildLineSubmitPayload(customer));

      let discountCode = draft.discountCode;
      let discountAmount = draft.discountAmount;

      if (
        customer.lineUserId &&
        (!discountCode || isWelcomeCouponCode(discountCode) || isWelcomeGiftPlaceholder(discountCode))
      ) {
        const welcome = await fetchWelcomeCoupon({
          lineUserId: customer.lineUserId,
          phone: customer.phone,
          email: customer.email,
          ensure: true
        });
        if (welcome.valid) {
          discountCode = welcome.code;
          discountAmount = welcome.discountValue;
        } else if (discountCode && isWelcomeGiftPlaceholder(discountCode)) {
          discountCode = undefined;
          discountAmount = undefined;
        }
      }

      const nextDraft = {
        ...draft,
        customer,
        discountCode,
        discountAmount
      };
      saveDraft(nextDraft);

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

  return (
    <CustomerLayout>
      <OrderStepIndicator current={3}>
        <Card className="border-0 bg-card shadow-none">
          <form onSubmit={submit}>
            <CardHeader className="p-5 sm:p-7">
              <p className={stepEyebrow}>{t.customerInfo.step}</p>
              <h1 className={cn("mt-2", pageTitle)}>{t.customerInfo.title}</h1>
              <p className="mt-2 font-normal text-muted-foreground">{t.customerInfo.subtitle}</p>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-0 sm:px-7 sm:pb-7">
            <LineDebugPanel />
            <TextField
              id="customer-name"
              label={t.customerInfo.fullName}
              value={form.name}
              error={errors.name}
              onChange={(name) => setForm({ ...form, name })}
            />
            <TextField
              id="customer-phone"
              label={t.customerInfo.phone}
              value={form.phone}
              error={errors.phone}
              onChange={(phone) => setForm({ ...form, phone })}
            />
            <TextField
              id="customer-line-id"
              label={t.customerInfo.lineId}
              value={form.lineId}
              error={errors.lineId}
              onChange={(lineId) => setForm({ ...form, lineId })}
            />
            {emailRequired ? (
              <TextField
                id="customer-email"
                label={t.customerInfo.email}
                value={form.email}
                error={errors.email}
                onChange={(email) => setForm({ ...form, email })}
                type="email"
                placeholder={t.customerInfo.emailPlaceholder}
              />
            ) : null}

            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4">
              <Checkbox
                id="allow-social-share"
                checked={form.allowSocialShare}
                onCheckedChange={(checked) => {
                  const allowSocialShare = checked === true;
                  setForm({
                    ...form,
                    allowSocialShare,
                    instagramUsername: allowSocialShare ? form.instagramUsername : ""
                  });
                  if (!allowSocialShare) {
                    setErrors((current) => {
                      if (!current.instagram) return current;
                      const next = { ...current };
                      delete next.instagram;
                      return next;
                    });
                  }
                }}
              />
              <Label htmlFor="allow-social-share" className="text-sm font-semibold leading-snug">
                {t.customerInfo.allowSocialShare}
              </Label>
            </div>

            {form.allowSocialShare ? (
              <TextField
                id="customer-instagram"
                label={t.customerInfo.instagramUsername}
                value={form.instagramUsername}
                error={errors.instagram}
                onChange={(instagramUsername) => setForm({ ...form, instagramUsername })}
                placeholder={t.customerInfo.instagramPlaceholder}
              />
            ) : null}

            <OrderStepNavigation
              onBack={goBack}
              continueLabel={submitting ? t.payment.submitting : t.payment.confirmOrder}
              continueType="submit"
              continueDisabled={submitting}
              continueLoading={submitting}
            />
          </CardContent>
        </form>
        </Card>
      </OrderStepIndicator>

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

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  required = true,
  type = "text",
  placeholder
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? "" : " (optional)"}
      </Label>
      <Input
        id={id}
        className={cn("h-11", error && "border-destructive focus-visible:ring-destructive")}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={!!error}
      />
      {error ? <p className="text-sm font-semibold text-destructive">{error}</p> : null}
    </div>
  );
}
