export const FIRST_ORDER_CODE_PREFIX = "FIRSTFILM";

export const COUNTABLE_ORDER_STATUSES = [
  "Received",
  "Developing+Scanning",
  "Ready",
  "Completed"
] as const;

export function formatFirstOrderDiscountCode(sequence: number): string {
  return `${FIRST_ORDER_CODE_PREFIX}${String(sequence).padStart(2, "0")}`;
}
