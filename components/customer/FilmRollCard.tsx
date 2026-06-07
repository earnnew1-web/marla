"use client";

import { Info, Trash2 } from "lucide-react";
import { useCallback, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { bahtSpaced } from "@/lib/format";
import { FILM_BRANDS, getStocksForBrand } from "@/lib/film-catalog";
import { getFilmBrandLogoSrc } from "@/lib/film-brand-logos";
import {
  applyBrandChange,
  applyExpiredRecommendations,
  applyFilmTypeOrFormatChange,
  applyStockChange,
  withRollPrice
} from "@/lib/film-roll";
import {
  shouldShowFieldError,
  VALIDATION_MESSAGE,
  type FilmRollFieldKey
} from "@/lib/film-roll-validation";
import { EXPERIMENTAL_FILM_FEE, getServiceOptionsWithPrices } from "@/lib/film-pricing";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import { cardTitle, sectionTitle } from "@/lib/typography";
import type { FilmBrand } from "@/lib/film-catalog";
import type { BwDeveloper, FilmCondition, FilmRoll, FilmType, PushPullStops, PushPullType } from "@/lib/types";
import { FieldInfoTooltip } from "@/components/customer/FieldInfoTooltip";
import { SearchableSelect } from "@/components/customer/SearchableSelect";
import {
  filmFlowCard,
  filmFlowCardContent,
  filmFlowCardHeader,
  filmFlowCardTitle,
  filmFlowDivider,
  filmFlowNestedInset
} from "@/components/customer/filmFlowStyles";
import { cn } from "@/lib/utils";

const FILM_TYPE_CARDS: {
  value: FilmType;
  image: string;
  titleKey: "colorC41" | "motionEcn2" | "bw";
  subtitleKey?: "colorC41Subtitle" | "motionEcn2Subtitle";
}[] = [
  { value: "Color (C-41)", image: "/film-types/C41(1).svg", titleKey: "colorC41", subtitleKey: "colorC41Subtitle" },
  { value: "ECN-2", image: "/film-types/ECN(1).svg", titleKey: "motionEcn2", subtitleKey: "motionEcn2Subtitle" },
  { value: "B&W", image: "/film-types/BW(1).svg", titleKey: "bw" }
];

const BW_DEVELOPERS: BwDeveloper[] = [
  "Let us choose the best match (Recommended)",
  "Ilfotech HC",
  "Microphen",
  "ID-11"
];

const ERROR_RING = "rounded-2xl ring-2 ring-destructive/30 ring-offset-2 ring-offset-card";
const ERROR_INPUT = "border-destructive/60 focus-visible:ring-destructive/25";

type Props = {
  roll: FilmRoll;
  index: number;
  removable: boolean;
  submitAttempted: boolean;
  touchedFields: Set<FilmRollFieldKey>;
  onFieldBlur: (field: FilmRollFieldKey) => void;
  registerFieldRef: (field: FilmRollFieldKey, element: HTMLElement | null) => void;
  onChange: (roll: FilmRoll) => void;
  onRemove: () => void;
};

export function FilmRollCard({
  roll,
  index,
  removable,
  submitAttempted,
  touchedFields,
  onFieldBlur,
  registerFieldRef,
  onChange,
  onRemove
}: Props) {
  const { t } = useCustomerLanguage();
  const [pushPullModalOpen, setPushPullModalOpen] = useState(false);
  const services = getServiceOptionsWithPrices(roll.filmType, roll.format);

  const showError = useCallback(
    (field: FilmRollFieldKey) =>
      shouldShowFieldError(roll, field, {
        submitAttempted,
        touched: touchedFields.has(field)
      }),
    [roll, submitAttempted, touchedFields]
  );

  const setFieldRef = useCallback(
    (field: FilmRollFieldKey) => (element: HTMLElement | null) => registerFieldRef(field, element),
    [registerFieldRef]
  );

  const handleSectionBlur = (field: FilmRollFieldKey) => (event: React.FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      onFieldBlur(field);
    }
  };

  const update = (patch: Partial<FilmRoll>) => {
    onChange(withRollPrice({ ...roll, ...patch }));
  };

  const updateTypeOrFormat = (patch: Partial<Pick<FilmRoll, "filmType" | "format">>) => {
    onChange(applyFilmTypeOrFormatChange(roll, patch));
  };

  const handleConditionChange = (condition: FilmCondition) => {
    if (roll.experimentalFilm) return;

    if (condition === "Expired") {
      onChange(applyExpiredRecommendations({ ...roll, condition }));
      return;
    }

    update({ condition });
  };

  const handlePushPullToggle = (enabled: boolean) => {
    if (!enabled && roll.condition === "Expired" && !roll.experimentalFilm) {
      setPushPullModalOpen(true);
      return;
    }

    update({
      pushPullEnabled: enabled,
      pushPullExpanded: enabled ? true : roll.pushPullExpanded
    });
  };

  const confirmDisablePushPull = () => {
    update({
      pushPullEnabled: false,
      pushPullExpanded: false
    });
    setPushPullModalOpen(false);
  };

  const handleExperimentalToggle = (enabled: boolean) => {
    if (enabled) {
      onChange(
        withRollPrice({
          ...roll,
          experimentalFilm: true,
          condition: null
        })
      );
      return;
    }

    update({
      experimentalFilm: false,
      condition: roll.condition ?? "Fresh"
    });
  };

  const pushStops: PushPullStops[] = [1, 2, 3];
  const pullStops: PushPullStops[] = [-1, -2];
  const stopOptions = roll.pushPullType === "Push (+)" ? pushStops : pullStops;

  return (
    <>
      <Card className={filmFlowCard}>
        <CardHeader className={cn("flex-row items-start justify-between gap-3", filmFlowCardHeader)}>
          <h2 className={filmFlowCardTitle}>
            {t.filmRolls.filmDetails} #{index + 1}
          </h2>
          {removable ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground transition-colors duration-150 ease-out hover:bg-accent/[0.06] hover:text-foreground"
              onClick={onRemove}
              aria-label={`Remove roll ${index + 1}`}
            >
              <Trash2 size={16} />
            </Button>
          ) : null}
        </CardHeader>

        <CardContent className={filmFlowCardContent}>
          {/* 1. Film Type */}
          <ValidationField
            showError={showError("filmType")}
            fieldRef={setFieldRef("filmType")}
            onBlur={handleSectionBlur("filmType")}
          >
            <div className={cn("grid grid-cols-3 gap-2.5 p-0.5", showError("filmType") && ERROR_RING)}>
              {FILM_TYPE_CARDS.map((card) => {
                const selected = roll.filmType === card.value;
                const title = t.filmRolls[card.titleKey];
                const subtitle = card.subtitleKey ? t.filmRolls[card.subtitleKey] : null;
                return (
                  <button
                    key={card.value}
                    type="button"
                    onClick={() => updateTypeOrFormat({ filmType: card.value })}
                    aria-label={subtitle ? `${title} ${subtitle}` : title}
                    className={cn(
                      "flex flex-col items-center rounded-2xl border-2 px-2 pb-3 pt-3 transition",
                      selected
                        ? "border-accent/60 bg-accent/10 shadow-sm"
                        : "border-border/70 bg-card hover-surface",
                      showError("filmType") && !selected && "border-destructive/25"
                    )}
                  >
                    <div className="flex h-[84px] w-full items-center justify-center px-1.5 sm:h-[88px] md:h-24">
                      <img
                        src={card.image}
                        alt=""
                        aria-hidden
                        draggable={false}
                        className="h-full w-auto max-w-[88%] object-contain"
                      />
                    </div>
                    <span className="mt-2 px-1 text-center text-[11px] font-semibold leading-tight text-foreground sm:text-xs">
                      {title}
                    </span>
                    {subtitle ? (
                      <span className="mt-0.5 px-1 text-center text-[10px] leading-tight text-muted-foreground sm:text-[11px]">
                        {subtitle}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </ValidationField>

          {/* 2. Film Format */}
          <ValidationField
            label={t.filmRolls.format}
            showError={showError("format")}
            fieldRef={setFieldRef("format")}
            onBlur={handleSectionBlur("format")}
          >
            <PillSegmented
              value={roll.format}
              error={showError("format")}
              options={[
                { value: "35MM", label: "35MM" },
                { value: "120MM", label: "120MM" }
              ]}
              onChange={(value) => updateTypeOrFormat({ format: value as FilmRoll["format"] })}
            />
          </ValidationField>

          {/* 3. Film Brand */}
          <ValidationField
            label={t.filmRolls.brand}
            showError={showError("brand")}
            fieldRef={setFieldRef("brand")}
          >
            <SearchableSelect
              value={roll.brand}
              onValueChange={(value) => onChange(applyBrandChange(roll, value as FilmBrand))}
              options={FILM_BRANDS}
              placeholder={t.filmRolls.brandPlaceholder}
              searchPlaceholder={t.filmRolls.searchPlaceholder}
              emptyMessage={t.filmRolls.noResults}
              error={showError("brand")}
              onBlur={() => onFieldBlur("brand")}
              getOptionLogo={getFilmBrandLogoSrc}
              emptyFallback={{
                value: "Other",
                label: "Other",
                helperText: t.filmRolls.brandNotFoundHelper,
                onSelect: (query) =>
                  onChange({
                    ...applyBrandChange(roll, "Other"),
                    brandOther: query
                  })
              }}
            />
          </ValidationField>

          {roll.brand === "Other" ? (
            <ValidationField
              label={t.filmRolls.specifyBrand}
              showError={showError("brandOther")}
              fieldRef={setFieldRef("brandOther")}
            >
              <Input
                className={cn("h-11 rounded-xl border-border/80 bg-card", showError("brandOther") && ERROR_INPUT)}
                value={roll.brandOther}
                onChange={(event) => update({ brandOther: event.target.value })}
                onBlur={() => onFieldBlur("brandOther")}
                placeholder={t.filmRolls.specifyBrandPlaceholder}
              />
            </ValidationField>
          ) : null}

          {/* 4. Film Stock */}
          {roll.brand === "Other" ? (
            <ValidationField
              label={t.filmRolls.specifyStock}
              showError={showError("stockOther")}
              fieldRef={setFieldRef("stockOther")}
            >
              <Input
                className={cn("h-11 rounded-xl border-border/80 bg-card", showError("stockOther") && ERROR_INPUT)}
                value={roll.stockOther}
                onChange={(event) => update({ stockOther: event.target.value })}
                onBlur={() => onFieldBlur("stockOther")}
                placeholder={t.filmRolls.specifyStockPlaceholder}
              />
            </ValidationField>
          ) : (
            <>
              <ValidationField
                label={t.filmRolls.stock}
                showError={showError("stock")}
                fieldRef={setFieldRef("stock")}
              >
                <SearchableSelect
                  value={roll.stock}
                  onValueChange={(value) => onChange(applyStockChange(roll, value))}
                  options={roll.brand ? getStocksForBrand(roll.brand as FilmBrand) : []}
                  placeholder={t.filmRolls.stockPlaceholder}
                  searchPlaceholder={t.filmRolls.searchPlaceholder}
                  emptyMessage={t.filmRolls.noResults}
                  disabled={!roll.brand}
                  error={showError("stock")}
                  onBlur={() => onFieldBlur("stock")}
                />
              </ValidationField>

              {roll.stock === "Other" ? (
                <ValidationField
                  label={t.filmRolls.specifyStock}
                  showError={showError("stockOther")}
                  fieldRef={setFieldRef("stockOther")}
                >
                  <Input
                    className={cn(
                      "h-11 rounded-xl border-border/80 bg-card",
                      showError("stockOther") && ERROR_INPUT
                    )}
                    value={roll.stockOther}
                    onChange={(event) => update({ stockOther: event.target.value })}
                    onBlur={() => onFieldBlur("stockOther")}
                    placeholder={t.filmRolls.specifyStockPlaceholder}
                  />
                </ValidationField>
              ) : null}
            </>
          )}

          {/* 5. B&W Developer */}
          {roll.filmType === "B&W" ? (
            <ValidationField
              label={t.filmRolls.bwDeveloper}
              showError={showError("bwDeveloper")}
              fieldRef={setFieldRef("bwDeveloper")}
              onBlur={handleSectionBlur("bwDeveloper")}
            >
              <RadioGroup
                value={roll.bwDeveloper}
                onValueChange={(value) => update({ bwDeveloper: value as BwDeveloper })}
                className={cn("gap-2 p-0.5", showError("bwDeveloper") && ERROR_RING)}
              >
                {BW_DEVELOPERS.map((developer) => (
                  <RadioRow
                    key={developer}
                    id={`${roll.id}-dev-${developer}`}
                    value={developer}
                    selected={roll.bwDeveloper === developer}
                    label={developer.replace(" (Recommended)", "")}
                    error={showError("bwDeveloper")}
                  />
                ))}
              </RadioGroup>
            </ValidationField>
          ) : null}

          {/* 6. Film Condition */}
          <Field label={t.filmRolls.filmCondition}>
            <div className={cn(roll.experimentalFilm && "opacity-50")}>
              <ChoiceSegmented
                value={roll.condition ?? ""}
                disabled={roll.experimentalFilm}
                options={[
                  { value: "Fresh", label: t.filmRolls.fresh },
                  {
                    value: "Expired",
                    label: t.filmRolls.expired,
                    tooltip: roll.experimentalFilm ? undefined : t.filmRolls.expiredTooltip
                  }
                ]}
                onChange={(value) => handleConditionChange(value as FilmCondition)}
              />
            </div>
            {roll.experimentalFilm ? (
              <p className="text-sm text-muted-foreground">{t.filmRolls.filmSoupConditionNote}</p>
            ) : null}
            {!roll.experimentalFilm && roll.condition === "Expired" ? (
              <p className="text-sm leading-relaxed text-accent">{t.filmRolls.expiredRecommendation}</p>
            ) : null}
          </Field>

          {/* 7. Select Service */}
          <ValidationField
            label={t.filmRolls.selectService}
            showError={showError("service")}
            fieldRef={setFieldRef("service")}
            onBlur={handleSectionBlur("service")}
          >
            <RadioGroup
              value={roll.service}
              onValueChange={(value) => update({ service: value as FilmRoll["service"] })}
              className={cn("gap-2 p-0.5", showError("service") && ERROR_RING)}
            >
              {services.map(({ service, price }) => (
                <RadioRow
                  key={service}
                  id={`${roll.id}-${service}`}
                  value={service}
                  selected={roll.service === service}
                  label={service}
                  price={bahtSpaced(price)}
                  error={showError("service")}
                />
              ))}
            </RadioGroup>
          </ValidationField>

          {/* 8. Special Details */}
          <div className="space-y-3">
            <p className={sectionTitle}>{t.filmRolls.specialDetails}</p>

            <div className="space-y-1">
              <CheckboxRow
                checked={roll.pushPullEnabled}
                onCheckedChange={handlePushPullToggle}
                label={t.filmRolls.pushPull}
                price={t.filmRolls.pushPullFeeShort}
                infoTooltip={{
                  title: t.filmRolls.pushPullTooltipTitle,
                  description: t.filmRolls.pushPullTooltipDescription
                }}
              />

              <div
                className={cn(
                  "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out",
                  roll.pushPullEnabled
                    ? "mt-3 grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className={cn(filmFlowNestedInset, "ml-7 space-y-4")}>
                    <ValidationField
                      label={t.filmRolls.pushPullType}
                      showError={showError("pushPullType")}
                      fieldRef={setFieldRef("pushPullType")}
                      onBlur={handleSectionBlur("pushPullType")}
                    >
                      <PillSegmented
                        value={roll.pushPullType}
                        error={showError("pushPullType")}
                        options={[
                          { value: "Push (+)", label: t.filmRolls.push },
                          { value: "Pull (-)", label: t.filmRolls.pull }
                        ]}
                        onChange={(value) => {
                          const type = value as PushPullType;
                          const stops: PushPullStops = type === "Push (+)" ? 1 : -1;
                          update({ pushPullType: type, pushPullStops: stops, pushPullExpanded: true });
                        }}
                      />
                    </ValidationField>

                    <div className={cn("border-t pt-4", filmFlowDivider)}>
                      <ValidationField
                        label={t.filmRolls.stops}
                        showError={showError("pushPullStops")}
                        fieldRef={setFieldRef("pushPullStops")}
                        onBlur={handleSectionBlur("pushPullStops")}
                      >
                        <ChipSegmented
                          value={String(roll.pushPullStops)}
                          error={showError("pushPullStops")}
                          options={stopOptions.map((stop) => ({
                            value: String(stop),
                            label: stop > 0 ? `+${stop}` : String(stop)
                          }))}
                          onChange={(value) => update({ pushPullStops: Number(value) as PushPullStops })}
                        />
                      </ValidationField>
                    </div>
                  </div>
                </div>
              </div>

              <CheckboxRow
                checked={roll.experimentalFilm}
                onCheckedChange={handleExperimentalToggle}
                label={t.filmRolls.experimentalFilm}
                price={bahtSpaced(EXPERIMENTAL_FILM_FEE, true)}
                infoTooltip={{
                  title: t.filmRolls.experimentalFilmTooltipTitle,
                  description: t.filmRolls.experimentalFilmTooltipDescription
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={pushPullModalOpen} onOpenChange={setPushPullModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={cardTitle}>{t.filmRolls.pushPullModalTitle}</DialogTitle>
            <DialogDescription className="whitespace-pre-line">{t.filmRolls.pushPullModalBody}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button type="button" onClick={confirmDisablePushPull}>
              {t.filmRolls.pushPullModalContinue}
            </Button>
            <Button type="button" variant="outline" onClick={() => setPushPullModalOpen(false)}>
              {t.filmRolls.pushPullModalKeep}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ValidationField({
  label,
  showError,
  fieldRef,
  onBlur,
  children
}: {
  label?: string;
  showError: boolean;
  fieldRef: (element: HTMLElement | null) => void;
  onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={fieldRef}
      tabIndex={-1}
      onBlur={onBlur}
      className="space-y-2.5 outline-none"
    >
      {label ? <Label className={sectionTitle}>{label}</Label> : null}
      {children}
      {showError ? <p className="text-xs text-destructive/90">{VALIDATION_MESSAGE}</p> : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <Label className={sectionTitle}>{label}</Label>
      {children}
    </div>
  );
}

function PillSegmented({
  value,
  options,
  onChange,
  disabled = false,
  error = false
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex rounded-full border bg-card p-1",
        error ? "border-destructive/60" : "border-border/80",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 rounded-full px-3 py-2.5 text-sm font-semibold transition",
            value === option.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-foreground hover:bg-accent/[0.05] active:bg-accent/[0.08]"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ChoiceSegmented({
  value,
  options,
  onChange,
  disabled = false
}: {
  value: string;
  options: { value: string; label: string; tooltip?: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("grid grid-cols-2 gap-2.5", disabled && "pointer-events-none")}>
        {options.map((option) => {
          const selected = value === option.value;
          const button = (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                "rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition",
                selected
                  ? "border-accent/60 bg-accent/10 text-foreground"
                  : "border-border/70 bg-card text-foreground hover:border-accent/30 hover:bg-accent/[0.04]",
                disabled && "cursor-not-allowed"
              )}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                {option.label}
                {option.tooltip ? <Info size={14} className="shrink-0 opacity-50" /> : null}
              </span>
            </button>
          );

          if (!option.tooltip) return button;

          return (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent>{option.tooltip}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

function ChipSegmented({
  value,
  options,
  onChange,
  error = false
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  error?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 rounded-2xl p-0.5",
        error && ERROR_RING
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "min-w-[3rem] rounded-full border-2 px-4 py-2 text-sm font-semibold transition",
            value === option.value
              ? "border-accent/60 bg-accent/10 text-foreground"
              : "border-border/70 bg-card text-foreground hover:border-accent/30 hover:bg-accent/[0.04]",
            error && value !== option.value && "border-destructive/25"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function RadioRow({
  id,
  value,
  selected,
  label,
  price,
  error = false
}: {
  id: string;
  value: string;
  selected: boolean;
  label: string;
  price?: string;
  error?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3.5 transition",
        selected ? "border-primary/30 bg-primary/[0.04]" : "border-border/70 bg-card hover:border-accent/25 hover:bg-accent/[0.03]",
        error && !selected && "border-destructive/25"
      )}
    >
      <div className="flex items-center gap-3">
        <RadioGroupItem value={value} id={id} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {price ? <span className="text-sm font-semibold tabular-nums text-foreground">{price}</span> : null}
    </label>
  );
}

function CheckboxRow({
  checked,
  onCheckedChange,
  label,
  price,
  infoTooltip
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  price: string;
  infoTooltip?: { title: string; description: string };
}) {
  const checkboxId = useId();

  return (
    <div className="flex items-center justify-between rounded-xl px-1 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <Checkbox
          id={checkboxId}
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
        />
        <div className="flex min-w-0 items-center gap-1.5">
          <label htmlFor={checkboxId} className="cursor-pointer text-sm font-medium">
            {label}
          </label>
          {infoTooltip ? (
            <FieldInfoTooltip title={infoTooltip.title} description={infoTooltip.description} />
          ) : null}
        </div>
      </div>
      <span className="shrink-0 pl-3 text-sm tabular-nums text-muted-foreground">{price}</span>
    </div>
  );
}
