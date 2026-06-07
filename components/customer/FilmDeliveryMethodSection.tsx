"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LabAddressCard } from "@/components/customer/LabAddressCard";
import { filmFlowCardTitle, filmFlowInset } from "@/components/customer/filmFlowStyles";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import type { FilmDeliveryMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  filmDeliveryMethod: FilmDeliveryMethod;
  onChange: (method: FilmDeliveryMethod) => void;
};

export function FilmDeliveryMethodSection({ filmDeliveryMethod, onChange }: Props) {
  const { t } = useCustomerLanguage();

  return (
    <div className={cn(filmFlowInset, "space-y-4")}>
      <h2 className={filmFlowCardTitle}>{t.customerInfo.filmDeliveryTitle}</h2>
      <RadioGroup
        value={filmDeliveryMethod}
        onValueChange={(value) => onChange(value as FilmDeliveryMethod)}
        className="space-y-2"
      >
        <DeliveryOption
          id="film-delivery-drop-off"
          value="drop_off"
          selected={filmDeliveryMethod === "drop_off"}
          label={t.customerInfo.filmDeliveryDropOff}
          helper={t.customerInfo.filmDeliveryDropOffHelper}
        />
        <DeliveryOption
          id="film-delivery-parcel"
          value="parcel"
          selected={filmDeliveryMethod === "parcel"}
          label={t.customerInfo.filmDeliveryParcel}
          helper={t.customerInfo.filmDeliveryParcelHelper}
        />
      </RadioGroup>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out",
          filmDeliveryMethod === "parcel" ? "mt-1 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <LabAddressCard />
        </div>
      </div>
    </div>
  );
}

function DeliveryOption({
  id,
  value,
  selected,
  label,
  helper
}: {
  id: string;
  value: FilmDeliveryMethod;
  selected: boolean;
  label: string;
  helper: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer flex-col rounded-xl border px-4 py-3.5 transition",
        selected
          ? "border-primary/30 bg-primary/[0.04]"
          : "border-border/70 bg-card hover:border-accent/25 hover:bg-accent/[0.03]"
      )}
    >
      <div className="flex items-center gap-3">
        <RadioGroupItem value={value} id={id} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-2 pl-7 text-xs leading-relaxed text-muted-foreground">{helper}</p>
    </label>
  );
}
