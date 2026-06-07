import type { DeliveryInfo, DraftOrder, FilmReturn, ReturnMethod, ReturnShippingInfo } from "@/lib/types";

export const SHIPPING_FEE = 60;

export function emptyReturnShipping(): ReturnShippingInfo {
  return {
    recipientName: "",
    phone: "",
    address: ""
  };
}

export function returnMethodToFilmReturn(method: ReturnMethod): FilmReturn {
  return method === "post" ? "Delivery (+60 THB)" : "Pick up at store";
}

export function filmReturnToReturnMethod(filmReturn?: FilmReturn): ReturnMethod {
  return filmReturn === "Delivery (+60 THB)" ? "post" : "pickup";
}

export function getShippingFee(method: ReturnMethod): number {
  return method === "post" ? SHIPPING_FEE : 0;
}

export function buildDeliveryFromReturn(
  draft: DraftOrder,
  returnMethod: ReturnMethod,
  returnShipping: ReturnShippingInfo
): DeliveryInfo {
  const base: DeliveryInfo = {
    fileDelivery: draft.delivery?.fileDelivery ?? "Google Drive",
    filmReturn: returnMethodToFilmReturn(returnMethod),
    notes: draft.delivery?.notes ?? ""
  };

  if (returnMethod === "post") {
    return {
      ...base,
      recipientName: returnShipping.recipientName.trim(),
      recipientPhone: returnShipping.phone.trim(),
      address: returnShipping.address.trim()
    };
  }

  return {
    ...base,
    recipientName: undefined,
    recipientPhone: undefined,
    address: undefined
  };
}

export function loadReturnMethodState(draft: DraftOrder): {
  returnMethod: ReturnMethod;
  returnShipping: ReturnShippingInfo;
} {
  const returnMethod = draft.returnMethod ?? filmReturnToReturnMethod(draft.delivery?.filmReturn);

  return {
    returnMethod,
    returnShipping: {
      recipientName: draft.returnShipping?.recipientName ?? draft.delivery?.recipientName ?? "",
      phone: draft.returnShipping?.phone ?? draft.delivery?.recipientPhone ?? "",
      address: draft.returnShipping?.address ?? draft.delivery?.address ?? ""
    }
  };
}

export function prefillReturnShippingFromCustomer(
  shipping: ReturnShippingInfo,
  customer?: DraftOrder["customer"]
): ReturnShippingInfo {
  if (!customer) return shipping;

  return {
    ...shipping,
    recipientName: shipping.recipientName.trim() || customer.name?.trim() || "",
    phone: shipping.phone.trim() || customer.phone?.trim() || ""
  };
}
