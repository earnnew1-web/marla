export const ORDER_CODE_PREFIX = "ML-";
export const ORDER_CODE_PAD = 6;

/** Format sequence as ML-000001 */
export function formatOrderCode(sequence: number): string {
  return `${ORDER_CODE_PREFIX}${String(sequence).padStart(ORDER_CODE_PAD, "0")}`;
}

/** Parse ML-000042 → 42. Returns null for legacy or invalid codes. */
export function parseOrderCodeSequence(code: string): number | null {
  const match = String(code).trim().match(/^ML-(\d+)$/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Next sequence after the highest ML-* code in the list. */
export function nextOrderCodeSequence(codes: string[]): number {
  let max = 0;
  for (const code of codes) {
    const value = parseOrderCodeSequence(code);
    if (value !== null) max = Math.max(max, value);
  }
  return max + 1;
}
