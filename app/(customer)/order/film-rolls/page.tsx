"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CustomerLayout } from "@/components/customer/CustomerLayout";
import { FilmRollCard } from "@/components/customer/FilmRollCard";
import { FilmRollsOrderSummary } from "@/components/customer/FilmRollsOrderSummary";
import { OrderStepIndicator } from "@/components/customer/OrderStepIndicator";
import { OrderStepNavigation } from "@/components/customer/OrderStepNavigation";
import { ReturnMethodSection } from "@/components/customer/ReturnMethodSection";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  fieldRefKey,
  findFirstInvalidField,
  focusFieldElement,
  isRollValid,
  type FilmRollFieldKey
} from "@/lib/film-roll-validation";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { pageTitle, stepEyebrow } from "@/lib/typography";
import {
  buildDeliveryFromReturn,
  emptyReturnShipping,
  loadReturnMethodState,
  prefillReturnShippingFromCustomer
} from "@/lib/return-method";
import {
  findFirstInvalidReturnField,
  isReturnMethodValid,
  type ReturnMethodFieldKey
} from "@/lib/return-method-validation";
import { emptyRoll, loadDraft, saveDraft } from "@/lib/storage";
import type { FilmRoll, ReturnMethod, ReturnShippingInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function FilmRollsPage() {
  const router = useRouter();
  const { t } = useCustomerLanguage();
  const [rolls, setRolls] = useState<FilmRoll[]>([]);
  const [returnMethod, setReturnMethod] = useState<ReturnMethod>("pickup");
  const [returnShipping, setReturnShipping] = useState<ReturnShippingInfo>(emptyReturnShipping());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedByRoll, setTouchedByRoll] = useState<Record<string, Set<FilmRollFieldKey>>>({});
  const [touchedReturnFields, setTouchedReturnFields] = useState<Set<ReturnMethodFieldKey>>(new Set());
  const fieldRefs = useRef<Map<string, HTMLElement>>(new Map());
  const returnFieldRefs = useRef<Map<ReturnMethodFieldKey, HTMLElement>>(new Map());
  const shippingPrefillAppliedRef = useRef(false);

  useEffect(() => {
    const draft = loadDraft();
    setRolls(draft.rolls?.length ? draft.rolls : [emptyRoll()]);
    const { returnMethod: method, returnShipping: shipping } = loadReturnMethodState(draft);
    setReturnMethod(method);
    if (method === "post") {
      shippingPrefillAppliedRef.current = true;
      setReturnShipping(prefillReturnShippingFromCustomer(shipping, draft.customer));
    } else {
      setReturnShipping(shipping);
    }
  }, []);

  const handleReturnMethodChange = useCallback((method: ReturnMethod) => {
    setReturnMethod(method);
    if (method !== "post" || shippingPrefillAppliedRef.current) return;

    shippingPrefillAppliedRef.current = true;
    const draft = loadDraft();
    setReturnShipping((prev) => prefillReturnShippingFromCustomer(prev, draft.customer));
  }, []);

  const markTouched = useCallback((rollId: string, field: FilmRollFieldKey) => {
    setTouchedByRoll((prev) => {
      const existing = prev[rollId] ?? new Set<FilmRollFieldKey>();
      if (existing.has(field)) return prev;
      const next = new Set(existing);
      next.add(field);
      return { ...prev, [rollId]: next };
    });
  }, []);

  const markReturnTouched = useCallback((field: ReturnMethodFieldKey) => {
    setTouchedReturnFields((prev) => {
      if (prev.has(field)) return prev;
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  }, []);

  const registerFieldRef = useCallback(
    (rollId: string, field: FilmRollFieldKey, element: HTMLElement | null) => {
      const key = fieldRefKey(rollId, field);
      if (element) fieldRefs.current.set(key, element);
      else fieldRefs.current.delete(key);
    },
    []
  );

  const registerReturnFieldRef = useCallback(
    (field: ReturnMethodFieldKey, element: HTMLElement | null) => {
      if (element) returnFieldRefs.current.set(field, element);
      else returnFieldRefs.current.delete(field);
    },
    []
  );

  const continueNext = () => {
    setSubmitAttempted(true);

    if (!rolls.every(isRollValid)) {
      const firstInvalid = findFirstInvalidField(rolls);
      if (firstInvalid) {
        requestAnimationFrame(() => {
          const element = fieldRefs.current.get(fieldRefKey(firstInvalid.rollId, firstInvalid.field));
          if (element) focusFieldElement(element);
        });
      }
      return;
    }

    if (!isReturnMethodValid(returnMethod, returnShipping)) {
      const firstInvalid = findFirstInvalidReturnField(returnMethod, returnShipping);
      if (firstInvalid) {
        requestAnimationFrame(() => {
          const element = returnFieldRefs.current.get(firstInvalid);
          if (element) focusFieldElement(element);
        });
      }
      return;
    }

    const draft = loadDraft();
    saveDraft({
      ...draft,
      rolls,
      returnMethod,
      returnShipping,
      delivery: buildDeliveryFromReturn(draft, returnMethod, returnShipping)
    });
    router.push("/order/payment");
  };

  const goBack = () => {
    const draft = loadDraft();
    saveDraft({
      ...draft,
      rolls,
      returnMethod,
      returnShipping,
      delivery: buildDeliveryFromReturn(draft, returnMethod, returnShipping)
    });
    router.push("/order/customer-info");
  };

  return (
    <CustomerLayout>
      <OrderStepIndicator current={2}>
        <Card className="border-0 bg-card shadow-none">
          <CardHeader className="p-5 sm:p-7">
            <p className={stepEyebrow}>{t.filmRolls.step}</p>
            <h1 className={cn("mt-2", pageTitle)}>{t.filmRolls.title}</h1>
            <p className="mt-2 text-muted-foreground">{t.filmRolls.subtitle}</p>
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0 sm:px-7 sm:pb-7">
            <div className="space-y-4">
              {rolls.map((roll, index) => (
                <FilmRollCard
                  key={roll.id}
                  roll={roll}
                  index={index}
                  removable={rolls.length > 1}
                  submitAttempted={submitAttempted}
                  touchedFields={touchedByRoll[roll.id] ?? new Set()}
                  onFieldBlur={(field) => markTouched(roll.id, field)}
                  registerFieldRef={(field, element) => registerFieldRef(roll.id, field, element)}
                  onChange={(next) => setRolls(rolls.map((item) => (item.id === roll.id ? next : item)))}
                  onRemove={() => setRolls(rolls.filter((item) => item.id !== roll.id))}
                />
              ))}
              <button
                type="button"
                onClick={() => setRolls([...rolls, emptyRoll()])}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 text-sm font-semibold text-muted-foreground transition duration-150 ease-out hover:border-accent/35 hover:bg-accent/[0.04] hover:text-foreground/80"
              >
                <Plus size={16} />
                {t.filmRolls.addRoll}
              </button>
            </div>

            <ReturnMethodSection
              returnMethod={returnMethod}
              returnShipping={returnShipping}
              submitAttempted={submitAttempted}
              touchedFields={touchedReturnFields}
              onReturnMethodChange={handleReturnMethodChange}
              onShippingChange={(patch) => setReturnShipping((prev) => ({ ...prev, ...patch }))}
              onFieldBlur={markReturnTouched}
              registerFieldRef={registerReturnFieldRef}
            />

            <FilmRollsOrderSummary rolls={rolls} returnMethod={returnMethod} />

            <OrderStepNavigation
              onBack={goBack}
              continueLabel={t.filmRolls.continue}
              onContinue={continueNext}
              continueDisabled={rolls.length === 0}
            />
          </CardContent>
        </Card>
      </OrderStepIndicator>
    </CustomerLayout>
  );
}
