"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { FilmDeliveryMethodSection } from "@/components/customer/FilmDeliveryMethodSection";
import { OrderStepIndicator } from "@/components/customer/OrderStepIndicator";
import { OrderStepNavigation } from "@/components/customer/OrderStepNavigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { refreshLineProfile, useLiff, type LineProfile } from "@/components/line/LiffProvider";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { DEFAULT_FILM_DELIVERY_METHOD } from "@/lib/film-delivery";
import { finalizeCustomerLineFields, mergeCustomerLineProfile, resolveActiveLineProfile } from "@/lib/line/customer-fields";
import { pageTitle, stepEyebrow } from "@/lib/typography";
import { loadDraft, saveDraft } from "@/lib/storage";
import type { FilmDeliveryMethod } from "@/lib/types";
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
  const router = useRouter();
  const { t } = useCustomerLanguage();
  const { inLine, profile } = useLiff();
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [filmDeliveryMethod, setFilmDeliveryMethod] = useState<FilmDeliveryMethod>(DEFAULT_FILM_DELIVERY_METHOD);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const lineIdTouchedRef = useRef(false);

  useEffect(() => {
    const draft = loadDraft();
    setFilmDeliveryMethod(draft.filmDeliveryMethod ?? DEFAULT_FILM_DELIVERY_METHOD);
    if (!draft.customer) return;

    setForm({
      name: draft.customer.name,
      phone: draft.customer.phone,
      lineId: draft.customer.lineId ?? draft.customer.lineDisplayName ?? "",
      email: draft.customer.email ?? "",
      allowSocialShare: draft.customer.allowSocialShare ?? false,
      instagramUsername: draft.customer.instagramUsername ?? ""
    });

    const draftProfile = resolveActiveLineProfile(null, draft.customer);
    if (draftProfile) setLineProfile(draftProfile);
  }, []);

  useEffect(() => {
    if (!profile?.userId) return;
    setLineProfile(profile);

    setForm((current) => {
      const nextLineId = lineIdTouchedRef.current
        ? current.lineId
        : current.lineId.trim() || profile.displayName;

      const draft = loadDraft();
      saveDraft({
        ...draft,
        customer: finalizeCustomerLineFields(
          {
            ...(draft.customer ?? {
              name: current.name,
              phone: current.phone,
              email: current.email
            }),
            lineId: nextLineId
          },
          profile
        )
      });

      return current.lineId === nextLineId ? current : { ...current, lineId: nextLineId };
    });
  }, [profile]);

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
      let latestProfile = resolveActiveLineProfile(profile ?? lineProfile);
      if (inLine && !latestProfile?.userId) {
        latestProfile = await refreshLineProfile();
        if (latestProfile) setLineProfile(latestProfile);
      }

      const draft = loadDraft();
      const baseCustomer = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        lineId: form.lineId.trim(),
        email: form.email.trim(),
        allowSocialShare: form.allowSocialShare,
        instagramUsername:
          form.allowSocialShare && form.instagramUsername.trim() ? form.instagramUsername.trim() : null
      };

      saveDraft({
        ...draft,
        filmDeliveryMethod,
        customer: finalizeCustomerLineFields(
          mergeCustomerLineProfile(baseCustomer, latestProfile),
          latestProfile
        )
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
              onChange={(lineId) => {
                lineIdTouchedRef.current = true;
                setForm({ ...form, lineId });
              }}
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
