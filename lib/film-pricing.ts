import { FILMAGE_DISCOUNT, isFilmageBrand } from "@/lib/film-catalog";
import type { FilmOrderFormat, FilmRoll, FilmServiceOption, FilmType } from "@/lib/types";

export const PUSH_PULL_FEE_PER_STOP = 100;
export const EXPERIMENTAL_FILM_FEE = 100;

export const filmTypes: FilmType[] = ["Color (C-41)", "B&W", "ECN-2"];
export const filmOrderFormats: FilmOrderFormat[] = ["35MM", "120MM"];
export const filmServiceOptions: FilmServiceOption[] = [
  "Dev + Scan (M)",
  "Dev + Scan (XL)",
  "Dev Only",
  "Scan Only"
];

const PRICING_MATRIX: Record<FilmType, Record<FilmOrderFormat, Record<FilmServiceOption, number>>> = {
  "Color (C-41)": {
    "35MM": {
      "Dev + Scan (M)": 150,
      "Dev + Scan (XL)": 180,
      "Dev Only": 100,
      "Scan Only": 80
    },
    "120MM": {
      "Dev + Scan (M)": 180,
      "Dev + Scan (XL)": 210,
      "Dev Only": 130,
      "Scan Only": 110
    }
  },
  "B&W": {
    "35MM": {
      "Dev + Scan (M)": 170,
      "Dev + Scan (XL)": 200,
      "Dev Only": 120,
      "Scan Only": 100
    },
    "120MM": {
      "Dev + Scan (M)": 200,
      "Dev + Scan (XL)": 230,
      "Dev Only": 150,
      "Scan Only": 130
    }
  },
  "ECN-2": {
    "35MM": {
      "Dev + Scan (M)": 170,
      "Dev + Scan (XL)": 200,
      "Dev Only": 120,
      "Scan Only": 100
    },
    "120MM": {
      "Dev + Scan (M)": 200,
      "Dev + Scan (XL)": 230,
      "Dev Only": 150,
      "Scan Only": 130
    }
  }
};

export type PriceLine = {
  label: string;
  amount: number;
};

export function getServicePrice(
  filmType: FilmType,
  format: FilmOrderFormat,
  service: FilmServiceOption
): number {
  return PRICING_MATRIX[filmType][format][service];
}

export function getServiceOptionsWithPrices(
  filmType: FilmType,
  format: FilmOrderFormat
): { service: FilmServiceOption; price: number }[] {
  return filmServiceOptions.map((service) => ({
    service,
    price: getServicePrice(filmType, format, service)
  }));
}

export function pushPullLineLabel(roll: Pick<FilmRoll, "pushPullType" | "pushPullStops">): string {
  const sign = roll.pushPullStops > 0 ? "+" : "";
  return `${roll.pushPullType === "Push (+)" ? "Push" : "Pull"} ${sign}${roll.pushPullStops}`;
}

export function getPriceBreakdown(roll: FilmRoll): { lines: PriceLine[]; total: number } {
  const lines: PriceLine[] = [
    {
      label: roll.service,
      amount: getServicePrice(roll.filmType, roll.format, roll.service)
    }
  ];

  if (roll.pushPullEnabled) {
    lines.push({
      label: pushPullLineLabel(roll),
      amount: Math.abs(roll.pushPullStops) * PUSH_PULL_FEE_PER_STOP
    });
  }

  if (roll.experimentalFilm) {
    lines.push({
      label: "Experimental Film / Film Soup",
      amount: EXPERIMENTAL_FILM_FEE
    });
  }

  if (isFilmageBrand(roll.brand)) {
    lines.push({
      label: "Filmage Discount",
      amount: -FILMAGE_DISCOUNT
    });
  }

  const total = Math.max(0, lines.reduce((sum, line) => sum + line.amount, 0));
  return { lines, total };
}

export function priceRoll(roll: FilmRoll): number {
  return getPriceBreakdown(roll).total;
}

export function priceRollsTotal(rolls: FilmRoll[]): number {
  return rolls.reduce((sum, roll) => sum + priceRoll(roll), 0);
}
