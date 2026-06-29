import {
  EXPERIMENTAL_FILM_FEE,
  getPriceBreakdown,
  getServicePrice,
  normalizeFilmService,
  PUSH_PULL_FEE_PER_STOP,
  priceRollsTotal
} from "@/lib/film-pricing";
import { FILMAGE_DISCOUNT, isFilmageBrand } from "@/lib/film-catalog";
import { getShippingFee } from "@/lib/return-method";
import type { FilmRoll, ReturnMethod } from "@/lib/types";

export type OrderBreakdownKey =
  | "filmTotal"
  | "shipping"
  | "pushPull"
  | "filmSoup"
  | "filmageDiscount"
  | "promoDiscount";

export type OrderBreakdownLine = {
  key: OrderBreakdownKey;
  amount: number;
  promoCode?: string;
};

const FILMAGE_LABEL = "Filmage Discount";

export function getRollDisplayLines(roll: FilmRoll) {
  return getPriceBreakdown(roll).lines.filter((line) => line.label !== FILMAGE_LABEL);
}

export function getRollDisplaySubtotal(roll: FilmRoll): number {
  return getRollDisplayLines(roll).reduce((sum, line) => sum + line.amount, 0);
}

export function getTotalFilmageDiscount(rolls: FilmRoll[]): number {
  let total = 0;
  for (const roll of rolls) {
    if (isFilmageBrand(roll.brand)) {
      total -= FILMAGE_DISCOUNT;
    }
  }
  return total;
}

export function getStep2OrderSummary(rolls: FilmRoll[], returnMethod: ReturnMethod) {
  const shipping = getShippingFee(returnMethod);
  const filmageDiscount = getTotalFilmageDiscount(rolls);
  const rollsSubtotal = rolls.reduce((sum, roll) => sum + getRollDisplaySubtotal(roll), 0);
  const estimatedTotal = priceRollsTotal(rolls) + shipping;

  return {
    rolls: rolls.map((roll) => ({
      roll,
      lines: getRollDisplayLines(roll),
      subtotal: getRollDisplaySubtotal(roll)
    })),
    shipping,
    filmageDiscount,
    rollsSubtotal,
    estimatedTotal
  };
}

export function getOrderPriceBreakdown(
  rolls: FilmRoll[],
  returnMethod: ReturnMethod,
  promoDiscount?: { code: string; amount: number } | null
) {
  let filmTotal = 0;
  let pushPull = 0;
  let filmSoup = 0;
  let filmageDiscount = 0;

  for (const roll of rolls) {
    filmTotal += getServicePrice(roll.filmType, roll.format, normalizeFilmService(roll.service));

    if (roll.pushPullEnabled) {
      pushPull += Math.abs(roll.pushPullStops) * PUSH_PULL_FEE_PER_STOP;
    }

    if (roll.experimentalFilm) {
      filmSoup += EXPERIMENTAL_FILM_FEE;
    }

    if (isFilmageBrand(roll.brand)) {
      filmageDiscount -= FILMAGE_DISCOUNT;
    }
  }

  const shipping = getShippingFee(returnMethod);
  const lines: OrderBreakdownLine[] = [{ key: "filmTotal", amount: filmTotal }];

  if (shipping > 0) {
    lines.push({ key: "shipping", amount: shipping });
  }

  if (pushPull > 0) {
    lines.push({ key: "pushPull", amount: pushPull });
  }

  if (filmSoup > 0) {
    lines.push({ key: "filmSoup", amount: filmSoup });
  }

  if (filmageDiscount < 0) {
    lines.push({ key: "filmageDiscount", amount: filmageDiscount });
  }

  if (promoDiscount && promoDiscount.amount > 0) {
    lines.push({
      key: "promoDiscount",
      amount: -promoDiscount.amount,
      promoCode: promoDiscount.code
    });
  }

  const estimatedTotal = Math.max(0, priceRollsTotal(rolls) + shipping - (promoDiscount?.amount ?? 0));

  return { lines, estimatedTotal };
}
