"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { FilmDeliveryMethodSection } from "@/components/customer/FilmDeliveryMethodSection";
import { OrderStepIndicator } from "@/components/customer/OrderStepIndicator";
import { OrderStepNavigation } from "@/components/customer/OrderStepNavigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { useLiff } from "@/components/line/LiffProvider";
import { DEFAULT_FILM_DELIVERY_METHOD } from "@/lib/film-delivery";
import { pageTitle, stepEyebrow } from "@/lib/typography";
import { loadDraft, saveDraft } from "@/lib/storage";
import type { FilmDeliveryMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

type CustomerForm = {
  name: string;
  phone: string;
  email: string;
  allowSocialShare: boolean;
  instagramUsername: string;
};

const emptyForm = (): CustomerForm => ({
  name: "",
  phone: "",
  email: "",
  allowSocialShare: false,
  instagramUsername: ""
});

export default function CustomerInfoPage() {
  const router = useRouter();
  const { t } = useCustomerLanguage();
  const { profile } = useLiff();
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [filmDeliveryMethod, setFilmDeliveryMethod] = useState<FilmDeliveryMethod>(DEFAULT_FILM_DELIVERY_METHOD);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const lineConnected = Boolean(profile?.userId);

  useEffect(() => {
    const draft = loadDraft();
    setFilmDeliveryMethod(draft.filmDeliveryMethod ?? DEFAULT_FILM_DELIVERY_METHOD);
    if (!draft.customer) return;

    setForm({
      name: draft.customer.name,
      phone: draft.customer.phone,
      email: draft.customer.email ?? "",
      allowSocialShare: draft.customer.allowSocialShare ?? false,
      instagramUsername: draft.customer.instagramUsername ?? ""
    });
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = t.customerInfo.errors.name;
    if (!form.phone.trim()) nextErrors.phone = t.customerInfo.errors.phone;
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

    const draft = loadDraft();
    saveDraft({
      ...draft,
      filmDeliveryMethod,
      customer: {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        allowSocialShare: form.allowSocialShare,
        instagramUsername:
          form.allowSocialShare && form.instagramUsername.trim() ? form.instagramUsername.trim() : null,
        lineUserId: profile?.userId ?? null,
        lineDisplayName: profile?.displayName ?? null,
        linePictureUrl: profile?.pictureUrl ?? null,
        lineConnected
      }
    });
    router.push("/order/film-rolls");
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
              id="customer-email"
              label={t.customerInfo.email}
              value={form.email}
              error={errors.email}
              onChange={(email) => setForm({ ...form, email })}
              type="email"
              placeholder={t.customerInfo.emailPlaceholder}
            />

            {lineConnected && profile ? (
              <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-sm font-semibold text-emerald-800">
                {t.customerInfo.lineConnected.replace("{name}", profile.displayName)}
              </p>
            ) : null}

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

            <OrderStepNavigation showBack={false} continueLabel={t.customerInfo.continue} continueType="submit" />
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
