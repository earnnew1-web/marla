import { priceRoll as calculateRollPrice } from "@/lib/film-pricing";
import type { FilmRoll, PricingSettings } from "@/lib/types";

export const defaultPricing: PricingSettings = {
  developOnly: 100,
  developScanStandard: 150,
  developScanXL: 180,
  tiffAddon: 150,
  pushPullAddon: 100,
  deliveryFee: 60
};

export function priceRoll(roll: FilmRoll, _pricing = defaultPricing) {
  return calculateRollPrice(roll);
}

export function priceTotal(rolls: FilmRoll[], wantsDelivery: boolean, pricing = defaultPricing) {
  const rollsTotal = rolls.reduce((sum, roll) => sum + priceRoll(roll, pricing), 0);
  return rollsTotal + (wantsDelivery ? pricing.deliveryFee : 0);
}
