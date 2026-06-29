import type { ReturnMethod, ReturnShippingInfo } from "@/lib/types";

export type ReturnMethodFieldKey = "recipientName" | "phone" | "address";

export const RETURN_METHOD_FIELD_ORDER: ReturnMethodFieldKey[] = ["recipientName", "phone", "address"];

export function isReturnFieldInvalid(
  returnMethod: ReturnMethod,
  returnShipping: ReturnShippingInfo,
  field: ReturnMethodFieldKey
): boolean {
  if (returnMethod !== "post") return false;

  switch (field) {
    case "recipientName":
      return !returnShipping.recipientName.trim();
    case "phone":
      return !returnShipping.phone.trim();
    case "address":
      return !returnShipping.address.trim();
    default:
      return false;
  }
}

export function isReturnMethodValid(
  returnMethod: ReturnMethod,
  returnShipping: ReturnShippingInfo
): boolean {
  if (returnMethod !== "post") return true;
  return RETURN_METHOD_FIELD_ORDER.every(
    (field) => !isReturnFieldInvalid(returnMethod, returnShipping, field)
  );
}

export function shouldShowReturnFieldError(
  returnMethod: ReturnMethod,
  returnShipping: ReturnShippingInfo,
  field: ReturnMethodFieldKey,
  options: { submitAttempted: boolean; touched: boolean }
): boolean {
  if (!isReturnFieldInvalid(returnMethod, returnShipping, field)) return false;
  return options.submitAttempted || options.touched;
}

export function findFirstInvalidReturnField(
  returnMethod: ReturnMethod,
  returnShipping: ReturnShippingInfo
): ReturnMethodFieldKey | null {
  for (const field of RETURN_METHOD_FIELD_ORDER) {
    if (isReturnFieldInvalid(returnMethod, returnShipping, field)) {
      return field;
    }
  }
  return null;
}
