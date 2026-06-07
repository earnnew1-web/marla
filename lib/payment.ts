import type { PaymentMethod, ReturnMethod } from "@/lib/types";

export const BANK_NAME = "ธนาคารกรุงศรีอยุธยา";
export const BANK_NAME_EN = "Krungsri Bank";
export const ACCOUNT_NUMBER = "418-4-19194-7";
export const ACCOUNT_NUMBER_COPY = "4184191947";
export const ACCOUNT_NAME_EN = "Mr. Photsathon Srimanop";
export const ACCOUNT_NAME_TH = "นาย พสธร ศรีมานพ";
export const PAYMENT_QR_SRC = "/payment/krungsri-qr.png";
export const KRUNGSRI_LOGO_SRC = "/images/bank-logo/krungsri.png";

export const PAYMENT_SLIP_ACCEPT = "image/jpeg,image/png,image/heic,.heic";

export function emptyPayment(method: PaymentMethod = "bank_transfer") {
  return { method };
}

export function isCashPaymentBlocked(returnMethod: ReturnMethod): boolean {
  return returnMethod === "post";
}

export function resolvePaymentMethod(
  _returnMethod: ReturnMethod,
  method: PaymentMethod | undefined
): PaymentMethod {
  return method ?? "bank_transfer";
}
