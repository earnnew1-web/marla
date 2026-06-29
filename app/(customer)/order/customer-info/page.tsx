"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { CustomerInfoLineConnectCard } from "@/components/customer/CustomerInfoLineConnectCard";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { FilmDeliveryMethodSection } from "@/components/customer/FilmDeliveryMethodSection";
import { LineDebugPanel } from "@/components/line/LineDebugPanel";
import { OrderStepIndicator } from "@/components/customer/OrderStepIndicator";
import { OrderStepNavigation } from "@/components/customer/OrderStepNavigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStoredLineProfile, refreshLineProfile, useLiff } from "@/components/line/LiffProvider";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { DEFAULT_FILM_DELIVERY_METHOD } from "@/lib/film-delivery";
import { applyLineProfileToCustomer, resolveLineProfile } from "@/lib/line/customer-fields";
import { pageTitle, stepEyebrow } from "@/lib/typography";
import { loadDraft, saveDraft } from "@/lib/storage";
import type { CustomerDraft, FilmDeliveryMethod } from "@/lib/types";
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
  allowSocialShare: false,
  instagramUsername: ""
});

export default function CustomerInfoPage() {
  return (
    <Suspense
      fallback={
        <CustomerLayout>
          <div className="mx-auto max-w-2xl px-1 py-12 text-center">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </CustomerLayout>
      }
    >
      <CustomerInfoContent />
    </Suspense>
  );
}

function CustomerInfoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useCustomerLanguage();
  const { inLine, profile, ready: liffReady } = useLiff();
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [customerDraft, setCustomerDraft] = useState<CustomerDraft | null>(null);
  const [filmDeliveryMethod, setFilmDeliveryMethod] = useState<FilmDeliveryMethod>(DEFAULT_FILM_DELIVERY_METHOD);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    setFilmDeliveryMethod(draft.filmDeliveryMethod ?? DEFAULT_FILM_DELIVERY_METHOD);
    if (draft.customer) {
      setCustomerDraft(draft.customer);
      setForm({
        name: draft.customer.name,
        phone: draft.customer.phone,
        lineId: draft.customer.lineId ?? "",
        email: draft.customer.email ?? "",
        allowSocialShare: draft.customer.allowSocialShare ?? false,
        instagramUsername: draft.customer.instagramUsername ?? ""
      });
    }
  }, []);

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
    setCustomerDraft(nextCustomer);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("mfl:skip-line-connect-step1");
    }
  }, [profile]);

  useEffect(() => {
    if (!liffReady || searchParams.get("connectLine") !== "1") return;

    void (async () => {
      const activeProfile = profile ?? (await refreshLineProfile());
      if (!activeProfile?.userId) return;

      const draft = loadDraft();
      const nextCustomer = applyLineProfileToCustomer(
        draft.customer ?? { name: "", phone: "", email: "" },
        activeProfile
      );
      saveDraft({ ...draft, customer: nextCustomer });
      setCustomerDraft(nextCustomer);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("mfl:skip-line-connect-step1");
      }
    })();
  }, [liffReady, profile, searchParams]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = t.customerInfo.errors.name;
    if (!form.phone.trim()) nextErrors.phone = t.customerInfo.errors.phone;
    if (!form.lineId.trim()) nextErrors.lineId = t.customerInfo.errors.lineId;
    if (!form.email.trim()) nextErrors.email = t.customerInfo.errors.email;
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
      let activeProfile = resolveLineProfile(profile ?? getStoredLineProfile());
      if (inLine && !activeProfile?.userId) {
        activeProfile = await refreshLineProfile();
      }

      const draft = loadDraft();
      const baseCustomer = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        lineId: form.lineId.trim(),
        email: form.email.trim(),
        allowSocialShare: form.allowSocialShare,
        instagramUsername:
          form.allowSocialShare && form.instagramUsername.trim() ? form.instagramUsername.trim() : null,
        lineUserId: draft.customer?.lineUserId,
        lineDisplayName: draft.customer?.lineDisplayName,
        linePictureUrl: draft.customer?.linePictureUrl,
        lineConnected: draft.customer?.lineConnected
      };

      saveDraft({
        ...draft,
        filmDeliveryMethod,
        customer: applyLineProfileToCustomer(baseCustomer, activeProfile)
      });
      router.push("/order/film-rolls");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomerLayout>
      <OrderStepIndicator current={1}>
        <Card className="border-0 bg-card shadow-none">
          <form onSubmit={submit}>
            <CardHeader className="p-5 sm:p-7">
              <p className={stepEyebrow}>{t.customerInfo.step}</p>
              <h1 className={cn("mt-2", pageTitle)}>{t.customerInfo.title}</h1>
              <p className="mt-2 font-normal text-muted-foreground">{t.customerInfo.subtitle}</p>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-0 sm:px-7 sm:pb-7">
            <CustomerInfoLineConnectCard
              customer={customerDraft}
              onCustomerChange={(customer) => {
                setCustomerDraft(customer);
                setForm((current) => ({
                  ...current,
                  name: customer.name || current.name,
                  phone: customer.phone || current.phone,
                  lineId: customer.lineId ?? current.lineId,
                  email: customer.email ?? current.email
                }));
              }}
            />
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
            <TextField
              id="customer-email"
              label={t.customerInfo.email}
              value={form.email}
              error={errors.email}
              onChange={(email) => setForm({ ...form, email })}
              type="email"
              placeholder={t.customerInfo.emailPlaceholder}
            />

            <FilmDeliveryMethodSection
              filmDeliveryMethod={filmDeliveryMethod}
              onChange={setFilmDeliveryMethod}
            />

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
              showBack={false}
              continueLabel={submitting ? "..." : t.customerInfo.continue}
              continueType="submit"
            />
          </CardContent>
        </form>
        </Card>
      </OrderStepIndicator>
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
