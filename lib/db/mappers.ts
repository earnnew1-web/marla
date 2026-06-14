import { parseFilmRollFromDb, filmRollToDb } from "@/lib/film-roll";
import { defaultPricing, priceRoll } from "@/lib/pricing";
import { getTotalFilmageDiscount } from "@/lib/order-pricing";
import {
  ACCOUNT_NAME_EN,
  ACCOUNT_NUMBER_COPY,
  BANK_NAME_EN
} from "@/lib/payment";
import { filmReturnToReturnMethod } from "@/lib/return-method";
import { TABLES } from "@/lib/config/tables";
import { normalizeStatusValue } from "@/lib/admin/status-styles";
import type {
  AdminCustomerRow,
  AdminDashboardStats,
  Customer,
  CustomerDraft,
  DeliveryInfo,
  DraftOrder,
  Order,
  OrderStatus,
  PaymentInfo,
  PaymentStatus,
  PricingSettings
} from "@/lib/types";
import { customerLineDbFields } from "@/lib/line/customer-fields";

export function normalizeStatus(status: OrderStatus | string): OrderStatus {
  return normalizeStatusValue(status);
}

export function normalizePaymentStatus(status: string | null | undefined): PaymentStatus {
  if (status === "paid" || status === "unpaid" || status === "pending_payment_confirmation") {
    return status;
  }
  return "pending_payment_confirmation";
}

export function getOrderSelect() {
  return [
    "id",
    "order_code",
    "status",
    "payment_status",
    "payment_method",
    "payment_slip_url",
    "payment_slip_file_name",
    "film_delivery_method",
    "return_method",
    "file_delivery",
    "film_return",
    "recipient_name",
    "recipient_phone",
    "address",
    "notes",
    "film_total",
    "shipping_fee",
    "discount_amount",
    "total_price",
    "created_at",
    "updated_at",
    `customer:${TABLES.customers}(id, name, phone, line_id, email, allow_social_share, instagram_username, line_user_id, line_display_name, line_picture_url, line_connected, created_at)`,
    `film_rolls:${TABLES.filmRolls}(*)`,
    `payment:${TABLES.payments}(method, status, slip_url, slip_file_name, bank_name, account_number, account_name, amount, confirmed_at)`
  ].join(", ");
}

type DbCustomer = {
  id: string;
  name: string;
  phone: string;
  line_id: string;
  email: string | null;
  allow_social_share?: boolean | null;
  instagram_username?: string | null;
  line_user_id?: string | null;
  line_display_name?: string | null;
  line_picture_url?: string | null;
  line_connected?: boolean | null;
  created_at: string;
};

type DbFilmRoll = {
  id: string;
  format: string;
  process: string;
  service: string;
  push_pull: string;
  scan_size: string;
  brand?: string | null;
  brand_other?: string | null;
  stock?: string | null;
  stock_other?: string | null;
  bw_developer?: string | null;
  condition?: string | null;
  push_pull_enabled?: boolean | null;
  push_pull_type?: string | null;
  push_pull_stops?: number | null;
  experimental_film?: boolean | null;
  notes: string | null;
  price: number;
};

type DbPaymentRow = {
  method: string;
  status: string;
  slip_url?: string | null;
  slip_file_name?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  account_name?: string | null;
  amount?: number | null;
  confirmed_at?: string | null;
};

export type DbOrderRow = {
  id: string;
  order_code: string;
  status: string;
  payment_status?: string | null;
  file_delivery: string;
  film_return: string;
  film_delivery_method?: string | null;
  return_method?: string | null;
  recipient_name?: string | null;
  recipient_phone?: string | null;
  address: string | null;
  notes: string | null;
  film_total?: number | null;
  shipping_fee?: number | null;
  discount_amount?: number | null;
  total_price: number;
  created_at: string;
  updated_at?: string | null;
  customer: DbCustomer | DbCustomer[] | null;
  film_rolls: DbFilmRoll[] | null;
  payment?: DbPaymentRow | DbPaymentRow[] | null;
  payment_method?: string | null;
  payment_slip_url?: string | null;
  payment_slip_file_name?: string | null;
};

function unwrapCustomer(customer: DbCustomer | DbCustomer[] | null): DbCustomer | null {
  if (!customer) return null;
  return Array.isArray(customer) ? customer[0] ?? null : customer;
}

function unwrapPayment(payment: DbPaymentRow | DbPaymentRow[] | null | undefined): DbPaymentRow | null {
  if (!payment) return null;
  return Array.isArray(payment) ? payment[0] ?? null : payment;
}

export function mapOrder(row: DbOrderRow): Order {
  const customerRow = unwrapCustomer(row.customer);
  if (!customerRow) {
    throw new Error(`Order ${row.id} is missing customer data`);
  }

  const customer: Customer = {
    id: customerRow.id,
    name: customerRow.name,
    phone: customerRow.phone,
    lineId: customerRow.line_id ?? "",
    email: customerRow.email ?? "",
    allowSocialShare: customerRow.allow_social_share ?? false,
    instagramUsername: customerRow.instagram_username ?? null,
    lineUserId: customerRow.line_user_id ?? null,
    lineDisplayName: customerRow.line_display_name ?? null,
    linePictureUrl: customerRow.line_picture_url ?? null,
    lineConnected: customerRow.line_connected ?? false,
    createdAt: customerRow.created_at
  };

  const delivery: DeliveryInfo = {
    fileDelivery: row.file_delivery as DeliveryInfo["fileDelivery"],
    filmReturn: row.film_return as DeliveryInfo["filmReturn"],
    recipientName: row.recipient_name ?? undefined,
    recipientPhone: row.recipient_phone ?? undefined,
    address: row.address ?? undefined,
    notes: row.notes ?? undefined
  };

  const paymentRow = unwrapPayment(row.payment);
  const paymentMethod = paymentRow?.method ?? row.payment_method;
  const paymentSlipUrl = paymentRow?.slip_url ?? row.payment_slip_url ?? undefined;
  const paymentStatus = paymentRow?.status ?? row.payment_status;

  const payment: PaymentInfo | undefined = paymentMethod
    ? {
        method: paymentMethod as PaymentInfo["method"],
        status: normalizePaymentStatus(paymentStatus),
        paymentSlipDataUrl: paymentSlipUrl ?? undefined,
        paymentSlipFileName: paymentRow?.slip_file_name ?? row.payment_slip_file_name ?? undefined,
        bankName: paymentRow?.bank_name ?? undefined,
        accountNumber: paymentRow?.account_number ?? undefined,
        accountName: paymentRow?.account_name ?? undefined,
        amount: paymentRow?.amount ?? row.total_price,
        confirmedAt: paymentRow?.confirmed_at ?? undefined
      }
    : undefined;

  return {
    id: row.id,
    orderCode: row.order_code,
    customer,
    rolls: (row.film_rolls ?? []).map((roll) => parseFilmRollFromDb(roll)),
    delivery,
    payment,
    status: normalizeStatus(row.status),
    totalPrice: row.total_price,
    filmTotal: row.film_total ?? undefined,
    shippingFee: row.shipping_fee ?? undefined,
    discountAmount: row.discount_amount ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
    filmDeliveryMethod: (row.film_delivery_method as Order["filmDeliveryMethod"]) ?? "drop_off",
    returnMethod:
      (row.return_method as Order["returnMethod"]) ??
      filmReturnToReturnMethod(row.film_return as DeliveryInfo["filmReturn"])
  };
}

/** Lightweight order for submit response — omits payment slip image data. */
export function mapSubmittedOrder(
  draft: DraftOrder,
  ids: { orderId: string; customerId: string; orderCode: string },
  payload: ReturnType<typeof draftToDbPayload>
): Order {
  if (!draft.customer || !draft.delivery || !draft.payment) {
    throw new Error("Order is missing required information.");
  }

  const createdAt = nowIso();
  const pricedRolls = draft.rolls.map((roll) => ({ ...roll, price: priceRoll(roll) }));

  return {
    id: ids.orderId,
    orderCode: ids.orderCode,
    customer: {
      id: ids.customerId,
      name: draft.customer.name,
      phone: draft.customer.phone,
      lineId: customerLineDbFields(draft.customer).line_id,
      email: draft.customer.email ?? "",
      allowSocialShare: draft.customer.allowSocialShare ?? false,
      instagramUsername: draft.customer.instagramUsername ?? null,
      lineUserId: draft.customer.lineUserId ?? null,
      lineDisplayName: draft.customer.lineDisplayName ?? null,
      linePictureUrl: draft.customer.linePictureUrl ?? null,
      lineConnected: draft.customer.lineConnected ?? false,
      createdAt
    },
    rolls: pricedRolls,
    delivery: draft.delivery,
    payment: {
      method: draft.payment.method,
      status: "pending_payment_confirmation",
      paymentSlipFileName: draft.payment.paymentSlipFileName,
      bankName: payload.payment.bank_name,
      accountNumber: payload.payment.account_number,
      accountName: payload.payment.account_name,
      amount: payload.payment.amount
    },
    status: payload.order.status as OrderStatus,
    totalPrice: payload.order.total_price,
    filmTotal: payload.order.film_total,
    shippingFee: payload.order.shipping_fee,
    discountAmount: payload.order.discount_amount,
    createdAt,
    filmDeliveryMethod: draft.filmDeliveryMethod ?? "drop_off",
    returnMethod: payload.order.return_method as Order["returnMethod"]
  };
}

function nowIso() {
  return new Date().toISOString();
}

export function buildDashboardStats(orders: Order[]): AdminDashboardStats {
  const today = new Date().toDateString();

  return {
    newToday: orders.filter((order) => new Date(order.createdAt).toDateString() === today).length,
    inProgress: orders.filter((order) =>
      ["Pending Payment Confirmation", "Received", "Developing+Scanning"].includes(order.status)
    ).length,
    ready: orders.filter((order) => order.status === "Ready").length,
    completedToday: orders.filter(
      (order) =>
        order.status === "Completed" && new Date(order.createdAt).toDateString() === today
    ).length
  };
}

export function serviceSummary(order: Order): string {
  const services = [...new Set(order.rolls.map((roll) => roll.service))];
  return services.join(", ");
}

export function buildCustomerRows(orders: Order[]): AdminCustomerRow[] {
  const byCustomer = new Map<string, AdminCustomerRow>();

  for (const order of orders) {
    const existing = byCustomer.get(order.customer.id);
    if (!existing) {
      byCustomer.set(order.customer.id, {
        id: order.customer.id,
        name: order.customer.name,
        phone: order.customer.phone,
        lineId: order.customer.lineId,
        lineDisplayName: order.customer.lineDisplayName,
        lineConnected: order.customer.lineConnected,
        email: order.customer.email,
        orderCount: 1,
        lastOrderAt: order.createdAt
      });
      continue;
    }

    existing.orderCount += 1;
    if (new Date(order.createdAt) > new Date(existing.lastOrderAt)) {
      existing.lastOrderAt = order.createdAt;
    }
  }

  return [...byCustomer.values()].sort(
    (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
  );
}

export function mapPricing(row: Record<string, unknown>): PricingSettings {
  return {
    developOnly: Number(row.develop_only ?? defaultPricing.developOnly),
    developScanStandard: Number(row.develop_scan_standard ?? defaultPricing.developScanStandard),
    developScanXL: Number(row.develop_scan_xl ?? defaultPricing.developScanXL),
    tiffAddon: Number(row.tiff_addon ?? defaultPricing.tiffAddon),
    pushPullAddon: Number(row.push_pull_addon ?? defaultPricing.pushPullAddon),
    deliveryFee: Number(row.delivery_fee ?? defaultPricing.deliveryFee)
  };
}

export function pricingToDb(pricing: PricingSettings) {
  return {
    develop_only: pricing.developOnly,
    develop_scan_standard: pricing.developScanStandard,
    develop_scan_xl: pricing.developScanXL,
    tiff_addon: pricing.tiffAddon,
    push_pull_addon: pricing.pushPullAddon,
    delivery_fee: pricing.deliveryFee
  };
}

export function draftToDbPayload(draft: DraftOrder) {
  if (!draft.customer || !draft.delivery || !draft.payment || draft.rolls.length === 0) {
    throw new Error("Order is missing required information.");
  }

  if (draft.payment.method === "bank_transfer" && !draft.payment.paymentSlipDataUrl) {
    throw new Error("Payment slip is required.");
  }

  const wantsDelivery = draft.delivery.filmReturn === "Delivery (+60 THB)";
  const pricedRolls = draft.rolls.map((roll) => ({ ...roll, price: priceRoll(roll) }));
  const rolls = pricedRolls.map((roll) => filmRollToDb(roll));
  const shippingFee = wantsDelivery ? 60 : 0;
  const discountAmount = getTotalFilmageDiscount(pricedRolls);
  const filmTotal = pricedRolls.reduce((sum, roll) => sum + roll.price, 0);
  const totalPrice = filmTotal + shippingFee;
  const returnMethod = draft.returnMethod ?? filmReturnToReturnMethod(draft.delivery.filmReturn);

  const initialStatus: OrderStatus =
    draft.payment.method === "cash" ? "Pending Payment Confirmation" : "Received";

  const lineFields = customerLineDbFields(draft.customer);

  return {
    customer: {
      name: draft.customer.name.trim(),
      phone: draft.customer.phone.trim(),
      line_id: lineFields.line_id,
      email: draft.customer.email?.trim() || null,
      allow_social_share: draft.customer.allowSocialShare ?? false,
      instagram_username:
        draft.customer.allowSocialShare && draft.customer.instagramUsername?.trim()
          ? draft.customer.instagramUsername.trim()
          : null,
      line_user_id: lineFields.line_user_id,
      line_display_name: lineFields.line_display_name,
      line_picture_url: lineFields.line_picture_url,
      line_connected: lineFields.line_connected
    },
    order: {
      status: initialStatus,
      payment_status: "pending_payment_confirmation" as PaymentStatus,
      payment_method: draft.payment.method,
      payment_slip_url: null,
      payment_slip_file_name: draft.payment.paymentSlipFileName ?? null,
      film_delivery_method: draft.filmDeliveryMethod ?? "drop_off",
      return_method: returnMethod,
      file_delivery: draft.delivery.fileDelivery,
      film_return: draft.delivery.filmReturn,
      recipient_name: draft.delivery.recipientName?.trim() || null,
      recipient_phone: draft.delivery.recipientPhone?.trim() || null,
      address: draft.delivery.address?.trim() || null,
      notes: draft.delivery.notes?.trim() || null,
      film_total: filmTotal,
      shipping_fee: shippingFee,
      discount_amount: discountAmount,
      total_price: totalPrice
    },
    payment: {
      method: draft.payment.method,
      status: "pending_payment_confirmation" as PaymentStatus,
      slip_url: draft.payment.paymentSlipDataUrl ?? null,
      slip_file_name: draft.payment.paymentSlipFileName ?? null,
      bank_name: BANK_NAME_EN,
      account_number: ACCOUNT_NUMBER_COPY,
      account_name: ACCOUNT_NAME_EN,
      amount: totalPrice
    },
    rolls
  };
}
