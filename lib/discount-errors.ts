export type DiscountErrorCode = "invalid" | "expired" | "already_used" | "not_eligible";

export function discountValidationError(
  errorCode: DiscountErrorCode,
  error: string
): { valid: false; error: string; errorCode: DiscountErrorCode } {
  return { valid: false, error, errorCode };
}
