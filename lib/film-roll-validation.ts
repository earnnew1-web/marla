import { isFilmBrand } from "@/lib/film-catalog";
import type { BwDeveloper, FilmRoll, PushPullStops } from "@/lib/types";

export type FilmRollFieldKey =
  | "filmType"
  | "format"
  | "brand"
  | "brandOther"
  | "stock"
  | "stockOther"
  | "bwDeveloper"
  | "service"
  | "pushPullType"
  | "pushPullStops";

export const FILM_ROLL_FIELD_ORDER: FilmRollFieldKey[] = [
  "filmType",
  "format",
  "brand",
  "brandOther",
  "stock",
  "stockOther",
  "bwDeveloper",
  "service",
  "pushPullType",
  "pushPullStops"
];

const BW_DEVELOPERS: BwDeveloper[] = [
  "Let us choose the best match (Recommended)",
  "Ilfotech HC",
  "Microphen",
  "ID-11"
];

const PUSH_STOPS: PushPullStops[] = [1, 2, 3];
const PULL_STOPS: PushPullStops[] = [-1, -2];

function isBrandOtherRequired(roll: FilmRoll): boolean {
  return roll.brand === "Other";
}

function isStockRequired(roll: FilmRoll): boolean {
  return roll.brand !== "" && roll.brand !== "Other";
}

function isStockOtherRequired(roll: FilmRoll): boolean {
  if (roll.brand === "Other") return true;
  return roll.stock === "Other";
}

export function isFieldInvalid(roll: FilmRoll, field: FilmRollFieldKey): boolean {
  switch (field) {
    case "filmType":
      return !roll.filmType;
    case "format":
      return !roll.format;
    case "brand":
      return !roll.brand || !isFilmBrand(roll.brand);
    case "brandOther":
      if (!isBrandOtherRequired(roll)) return false;
      return !roll.brandOther.trim();
    case "stock":
      if (!isStockRequired(roll)) return false;
      return !roll.stock.trim();
    case "stockOther":
      if (!isStockOtherRequired(roll)) return false;
      return !roll.stockOther.trim();
    case "service":
      return !roll.service;
    case "bwDeveloper":
      if (roll.filmType !== "B&W") return false;
      return !roll.bwDeveloper || !BW_DEVELOPERS.includes(roll.bwDeveloper);
    case "pushPullType":
      if (!roll.pushPullEnabled) return false;
      return roll.pushPullType !== "Push (+)" && roll.pushPullType !== "Pull (-)";
    case "pushPullStops":
      if (!roll.pushPullEnabled) return false;
      if (roll.pushPullType === "Push (+)") return !PUSH_STOPS.includes(roll.pushPullStops);
      return !PULL_STOPS.includes(roll.pushPullStops);
    default:
      return false;
  }
}

export function getInvalidFields(roll: FilmRoll): FilmRollFieldKey[] {
  return FILM_ROLL_FIELD_ORDER.filter((field) => isFieldInvalid(roll, field));
}

export function isRollValid(roll: FilmRoll): boolean {
  return getInvalidFields(roll).length === 0;
}

export function shouldShowFieldError(
  roll: FilmRoll,
  field: FilmRollFieldKey,
  options: { submitAttempted: boolean; touched: boolean }
): boolean {
  if (!isFieldInvalid(roll, field)) return false;
  return options.submitAttempted || options.touched;
}

export function fieldRefKey(rollId: string, field: FilmRollFieldKey): string {
  return `${rollId}:${field}`;
}

export function findFirstInvalidField(
  rolls: FilmRoll[]
): { rollId: string; field: FilmRollFieldKey } | null {
  for (const roll of rolls) {
    for (const field of FILM_ROLL_FIELD_ORDER) {
      if (isFieldInvalid(roll, field)) {
        return { rollId: roll.id, field };
      }
    }
  }
  return null;
}

export function focusFieldElement(container: HTMLElement) {
  container.scrollIntoView({ behavior: "smooth", block: "center" });
  const focusable = container.querySelector<HTMLElement>(
    "input:not([disabled]), button:not([disabled]), [tabindex='0']"
  );
  if (focusable) {
    focusable.focus({ preventScroll: true });
    return;
  }
  container.focus({ preventScroll: true });
}
