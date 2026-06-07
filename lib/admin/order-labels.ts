import type { FilmDeliveryMethod, PaymentStatus, ReturnMethod } from "@/lib/types";

export function formatPaymentMethod(method?: string) {
  if (method === "cash") return "Cash";
  if (method === "bank_transfer") return "Bank Transfer";
  return "—";
}

export function formatPaymentStatus(status?: PaymentStatus) {
  if (status === "paid") return "Paid";
  if (status === "unpaid") return "Unpaid";
  if (status === "pending_payment_confirmation") return "Pending confirmation";
  return "—";
}

export function formatFilmDeliveryMethod(method?: FilmDeliveryMethod) {
  if (method === "parcel") return "Send by Parcel";
  if (method === "drop_off") return "Drop off at Marla Film Lab";
  return "—";
}

export function formatReturnMethod(method?: ReturnMethod) {
  if (method === "post") return "Delivery by Post";
  if (method === "pickup") return "Pick up at Marla Film Lab";
  return "—";
}
