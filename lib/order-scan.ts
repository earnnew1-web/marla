import { normalizeFilmService } from "@/lib/film-pricing";
import type { FilmRoll, Order } from "@/lib/types";

export function rollIncludesScan(service: FilmRoll["service"] | string): boolean {
  return normalizeFilmService(service).includes("Scan");
}

export function orderHasScanService(order: Pick<Order, "rolls">): boolean {
  return order.rolls.some((roll) => rollIncludesScan(roll.service));
}

export function orderRequiresScanDriveUrl(order: Pick<Order, "rolls">): boolean {
  return orderHasScanService(order);
}

export function isValidScanDriveUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
