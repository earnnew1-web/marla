import { getRollBrandLabel, getRollStockLabel, isFilmBrand, type FilmBrand } from "@/lib/film-catalog";
import { getServicePrice, isServiceAvailable, normalizeFilmService, priceRoll } from "@/lib/film-pricing";

export { getRollBrandLabel, getRollStockLabel };
import type {
  BwDeveloper,
  FilmCondition,
  FilmOrderFormat,
  FilmRoll,
  FilmServiceOption,
  FilmType,
  PushPullStops,
  PushPullType
} from "@/lib/types";
import { getInvalidFields, isRollValid, type FilmRollFieldKey } from "@/lib/film-roll-validation";

export const ROLL_DETAILS_VERSION = 3;

export type FilmRollDetailsJson = {
  v: 2 | 3;
  brand: string;
  brandOther?: string;
  stock: string;
  stockOther?: string;
  bwDeveloper: BwDeveloper;
  condition: FilmCondition | null;
  pushPullEnabled: boolean;
  pushPullType: PushPullType;
  pushPullStops: PushPullStops;
  experimentalFilm: boolean;
};

export function emptyRoll(): FilmRoll {
  const roll: FilmRoll = {
    id: crypto.randomUUID(),
    filmType: "Color (C-41)",
    format: "35MM",
    brand: "",
    brandOther: "",
    stock: "",
    stockOther: "",
    bwDeveloper: "Let us choose the best match (Recommended)",
    service: "Dev + Scan (M)",
    condition: "Fresh",
    pushPullEnabled: false,
    pushPullExpanded: false,
    pushPullType: "Push (+)",
    pushPullStops: 1,
    experimentalFilm: false,
    price: 0
  };
  roll.price = priceRoll(roll);
  return roll;
}

export function withRollPrice(roll: FilmRoll): FilmRoll {
  return { ...roll, price: priceRoll(roll) };
}

export function applyExpiredRecommendations(roll: FilmRoll): FilmRoll {
  if (roll.experimentalFilm || roll.condition !== "Expired") {
    return roll;
  }

  return withRollPrice({
    ...roll,
    pushPullEnabled: true,
    pushPullExpanded: true,
    pushPullType: "Push (+)",
    pushPullStops: 1
  });
}

export function applyBrandChange(roll: FilmRoll, brand: FilmBrand): FilmRoll {
  return withRollPrice({
    ...roll,
    brand,
    brandOther: brand === "Other" ? roll.brandOther : "",
    stock: "",
    stockOther: ""
  });
}

export function applyStockChange(roll: FilmRoll, stock: string): FilmRoll {
  return withRollPrice({
    ...roll,
    stock,
    stockOther: stock === "Other" ? roll.stockOther : ""
  });
}

export function applyFilmTypeOrFormatChange(
  roll: FilmRoll,
  patch: Partial<Pick<FilmRoll, "filmType" | "format">>
): FilmRoll {
  const next: FilmRoll = { ...roll, ...patch };
  next.service = getDefaultService(next.filmType, next.format, next.service);
  return withRollPrice(next);
}

function getDefaultService(
  filmType: FilmType,
  format: FilmOrderFormat,
  current: FilmServiceOption
): FilmServiceOption {
  const normalized = normalizeFilmService(current);
  if (isServiceAvailable(filmType, format, normalized)) return normalized;
  return "Dev + Scan (M)";
}

export type FilmRollValidationError = FilmRollFieldKey;

/** @deprecated Use getInvalidFields / isRollValid from film-roll-validation */
export function validateRoll(roll: FilmRoll): FilmRollFieldKey | null {
  const invalid = getInvalidFields(roll);
  return invalid[0] ?? null;
}

export { isRollValid };

export function formatPushPullLabel(roll: Pick<FilmRoll, "pushPullEnabled" | "pushPullType" | "pushPullStops">): string {
  if (!roll.pushPullEnabled) return "Normal";
  const sign = roll.pushPullStops > 0 ? "+" : "";
  return `${roll.pushPullType === "Push (+)" ? "Push" : "Pull"} ${sign}${Math.abs(roll.pushPullStops)}`;
}

export function deriveScanSize(service: FilmServiceOption | string): string {
  const normalized = normalizeFilmService(service);
  if (normalized === "Dev + Scan (M)" || normalized === "Scan Only (M)") return "M";
  if (normalized === "Dev + Scan (XL)" || normalized === "Scan Only (XL)") return "XL";
  return "N/A";
}

export function filmRollToDb(roll: FilmRoll) {
  const details: FilmRollDetailsJson = {
    v: ROLL_DETAILS_VERSION,
    brand: roll.brand,
    brandOther: roll.brandOther.trim() || undefined,
    stock: roll.brand === "Other" ? roll.stockOther.trim() : roll.stock,
    stockOther: roll.stockOther.trim() || undefined,
    bwDeveloper: roll.bwDeveloper,
    condition: roll.condition,
    pushPullEnabled: roll.pushPullEnabled,
    pushPullType: roll.pushPullType,
    pushPullStops: roll.pushPullStops,
    experimentalFilm: roll.experimentalFilm
  };

  return {
    format: roll.format,
    process: roll.filmType,
    service: normalizeFilmService(roll.service),
    push_pull: formatPushPullLabel(roll),
    scan_size: deriveScanSize(roll.service),
    brand: roll.brand || null,
    brand_other: roll.brandOther.trim() || null,
    stock: roll.brand === "Other" ? roll.stockOther.trim() || null : roll.stock || null,
    stock_other: roll.stockOther.trim() || null,
    bw_developer: roll.bwDeveloper,
    condition: roll.condition,
    push_pull_enabled: roll.pushPullEnabled,
    push_pull_type: roll.pushPullType,
    push_pull_stops: roll.pushPullStops,
    experimental_film: roll.experimentalFilm,
    notes: JSON.stringify(details),
    price: roll.price
  };
}

export function parseFilmRollFromDb(row: {
  id: string;
  format: string;
  process: string;
  service: string;
  push_pull: string;
  scan_size: string;
  notes: string | null;
  price: number;
}): FilmRoll {
  let details: Partial<FilmRollDetailsJson> | null = null;

  if (row.notes) {
    try {
      const parsed = JSON.parse(row.notes) as Partial<FilmRollDetailsJson>;
      if (parsed.v === 2 || parsed.v === ROLL_DETAILS_VERSION) {
        details = parsed;
      }
    } catch {
      details = null;
    }
  }

  if (details) {
    const brand = details.brand && isFilmBrand(details.brand) ? details.brand : "";
    return {
      id: row.id,
      filmType: row.process as FilmType,
      format: row.format as FilmOrderFormat,
      brand,
      brandOther: details.brandOther ?? "",
      stock: brand === "Other" ? "" : details.stock ?? "",
      stockOther:
        details.stockOther ??
        (brand === "Other" ? details.stock ?? "" : details.stock === "Other" ? "" : ""),
      bwDeveloper: details.bwDeveloper ?? "Let us choose the best match (Recommended)",
      service: normalizeFilmService(row.service),
      condition: details.condition ?? "Fresh",
      pushPullEnabled: details.pushPullEnabled ?? row.push_pull !== "Normal",
      pushPullExpanded: details.pushPullEnabled ?? row.push_pull !== "Normal",
      pushPullType: details.pushPullType ?? "Push (+)",
      pushPullStops: details.pushPullStops ?? 1,
      experimentalFilm: details.experimentalFilm ?? false,
      price: row.price
    };
  }

  return normalizeStoredRoll({
    id: row.id,
    format: row.format,
    process: row.process,
    service: row.service,
    push_pull: row.push_pull,
    price: row.price
  });
}

type LegacyStoredRoll = {
  id?: string;
  format?: string;
  process?: string;
  service?: string;
  pushPull?: string;
  push_pull?: string;
  filmType?: FilmType;
  brand?: string;
  brandOther?: string;
  stock?: string;
  stockOther?: string;
  price?: number;
};

export function normalizeStoredRoll(raw: LegacyStoredRoll): FilmRoll {
  if (raw.filmType || raw.brand) {
    const base = emptyRoll();
    const brand = raw.brand && isFilmBrand(raw.brand) ? raw.brand : base.brand;
    return withRollPrice({
      ...base,
      ...raw,
      brand: brand as FilmRoll["brand"],
      brandOther: raw.brandOther ?? base.brandOther,
      stockOther: raw.stockOther ?? base.stockOther,
      id: raw.id ?? base.id
    } as FilmRoll);
  }

  if (raw.id) {
    return withRollPrice({ ...emptyRoll(), id: raw.id });
  }

  return emptyRoll();
}

export function normalizeRolls(rolls: unknown[]): FilmRoll[] {
  if (!rolls.length) return [emptyRoll()];
  return rolls.map((roll) => normalizeStoredRoll(roll as LegacyStoredRoll));
}
