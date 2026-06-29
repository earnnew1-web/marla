import { sendLineOrderReceivedFromContext } from "@/lib/line/send-status";
import { sendWelcomeCouponMessage } from "@/lib/line/send-welcome";
import { TABLES } from "@/lib/config/tables";
import {
  ensureWelcomeCouponForLineUser,
  fetchCouponsByLineUserIds,
  getCouponStatusLabel,
  markCustomerCouponUsed
} from "@/lib/db/customer-coupons";
import { incrementDiscountCodeUsage, validateDiscountCodeForOrder } from "@/lib/db/discount-codes";
import { formatOrderCode, nextOrderCodeSequence } from "@/lib/order-code";
import { defaultPricing } from "@/lib/pricing";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import type { DraftOrder, FilmDeliveryMethod, Order, OrderStatus, PaymentStatus, PricingSettings } from "@/lib/types";
import {
  buildCustomerRows,
  buildDashboardStats,
  draftToDbPayload,
  getOrderSelect,
  mapOrder,
  mapSubmittedOrder,
  mapPricing,
  pricingToDb,
  type DbOrderRow
} from "@/lib/db/mappers";

function nowIso() {
  return new Date().toISOString();
}

async function generateOrderCode(supabase: ReturnType<typeof createAdminSupabaseClient>): Promise<string> {
  const { data, error } = await supabase
    .from(TABLES.orders)
    .select("order_code")
    .like("order_code", "ML-%")
    .order("order_code", { ascending: false })
    .limit(50);

  if (error) throw error;

  const next = nextOrderCodeSequence((data ?? []).map((row) => row.order_code));
  return formatOrderCode(next);
}

export async function createOrderInDb(draft: DraftOrder): Promise<Order> {
  const supabase = createAdminSupabaseClient();
  const payload = draftToDbPayload(draft);
  const orderCode = await generateOrderCode(supabase);

  const subtotal = (payload.order.film_total ?? 0) + (payload.order.shipping_fee ?? 0);
  let promoCode: string | null = null;
  let promoAmount = 0;
  let promoCodeId: string | null = null;
  let promoSource: "discount_code" | "customer_coupon" | null = null;

  if (draft.discountCode?.trim()) {
    const validation = await validateDiscountCodeForOrder(draft.discountCode, {
      lineUserId: draft.customer?.lineUserId,
      phone: draft.customer?.phone,
      email: draft.customer?.email
    });

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    promoCode = validation.code.code;
    promoAmount = validation.code.discountValue;
    promoCodeId = validation.code.id;
    promoSource = validation.code.source ?? "discount_code";
  }

  const finalPrice = Math.max(0, subtotal - promoAmount);
  Object.assign(payload.order, {
    discount_code: promoCode,
    discount_amount: promoAmount,
    final_price: finalPrice,
    total_price: finalPrice
  });
  payload.payment.amount = finalPrice;

  const phone = payload.customer.phone.trim();
  let customerInsert = { ...payload.customer };

  if (phone && !customerInsert.line_user_id) {
    const { data: linkedCustomer } = await supabase
      .from(TABLES.customers)
      .select("line_user_id, line_display_name, line_picture_url, line_connected")
      .eq("phone", phone)
      .eq("line_connected", true)
      .not("line_user_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (linkedCustomer?.line_user_id) {
      customerInsert = {
        ...customerInsert,
        line_user_id: linkedCustomer.line_user_id,
        line_display_name: linkedCustomer.line_display_name,
        line_picture_url: linkedCustomer.line_picture_url,
        line_connected: true
      };
    }
  }

  const { data: customerRow, error: customerError } = await supabase
    .from(TABLES.customers)
    .insert(customerInsert)
    .select("id")
    .single();

  if (customerError) {
    throw new Error(formatSupabaseError(customerError));
  }

  const { data: orderRow, error: orderError } = await supabase
    .from(TABLES.orders)
    .insert({
      ...payload.order,
      order_code: orderCode,
      customer_id: customerRow.id
    })
    .select("id")
    .single();

  if (orderError) {
    throw new Error(formatSupabaseError(orderError));
  }

  const rollsPayload = payload.rolls.map((roll) => ({
    ...roll,
    order_id: orderRow.id
  }));

  const [rollsResult, paymentResult] = await Promise.all([
    supabase.from(TABLES.filmRolls).insert(rollsPayload),
    supabase.from(TABLES.payments).insert({
      ...payload.payment,
      order_id: orderRow.id
    })
  ]);

  if (rollsResult.error) {
    throw new Error(formatSupabaseError(rollsResult.error));
  }

  if (paymentResult.error) {
    throw new Error(formatSupabaseError(paymentResult.error));
  }

  if (customerInsert.line_user_id) {
    const { coupon, created } = await ensureWelcomeCouponForLineUser({
      lineUserId: customerInsert.line_user_id,
      customerId: customerRow.id
    });
    if (created) {
      await sendWelcomeCouponMessage(customerInsert.line_user_id, coupon.code);
    }
  }

  if (promoCodeId && promoSource === "customer_coupon") {
    await markCustomerCouponUsed(promoCodeId);
  } else if (promoCodeId) {
    await incrementDiscountCodeUsage(promoCodeId);
  }

  const order = mapSubmittedOrder(
    draft,
    { orderId: orderRow.id, customerId: customerRow.id, orderCode },
    payload
  );

  await sendLineOrderReceivedFromContext({
    orderId: orderRow.id,
    orderCode,
    totalPrice: payload.order.total_price,
    customerPhone: customerInsert.phone,
    lineUserId: customerInsert.line_user_id,
    orderStatus: payload.order.status,
    filmDeliveryMethod: payload.order.film_delivery_method as FilmDeliveryMethod
  });

  return order;
}

async function queryOrders(supabase: ReturnType<typeof createServerSupabaseClient>) {
  const { data, error } = await supabase
    .from(TABLES.orders)
    .select(getOrderSelect())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapOrder(row as unknown as DbOrderRow));
}

async function queryOrderById(supabase: ReturnType<typeof createServerSupabaseClient>, id: string) {
  const { data, error } = await supabase
    .from(TABLES.orders)
    .select(getOrderSelect())
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? mapOrder(data as unknown as DbOrderRow) : null;
}

export async function fetchOrdersFromDb(): Promise<Order[]> {
  return queryOrders(createServerSupabaseClient());
}

export async function fetchOrdersForAdmin(): Promise<Order[]> {
  return queryOrders(createAdminSupabaseClient());
}

export async function fetchOrderByIdFromDb(id: string): Promise<Order | null> {
  return queryOrderById(createServerSupabaseClient(), id);
}

export async function fetchOrderByIdForAdmin(id: string): Promise<Order | null> {
  return queryOrderById(createAdminSupabaseClient(), id);
}

export async function fetchOrderByCodeFromDb(code: string): Promise<Order | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.orders)
    .select(getOrderSelect())
    .ilike("order_code", code.trim())
    .maybeSingle();

  if (error) throw error;
  return data ? mapOrder(data as unknown as DbOrderRow) : null;
}

export async function fetchOrderByCodeAndPhone(code: string, phone: string): Promise<Order | null> {
  const order = await fetchOrderByCodeFromDb(code);
  if (!order) return null;
  return order.customer.phone.trim() === phone.trim() ? order : null;
}

export async function fetchOrderByCodeForAdmin(code: string): Promise<Order | null> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.orders)
    .select(getOrderSelect())
    .ilike("order_code", code.trim())
    .maybeSingle();

  if (error) throw error;
  return data ? mapOrder(data as unknown as DbOrderRow) : null;
}

export async function linkLineToOrderByCode(
  orderCode: string,
  profile: { userId: string; displayName: string; pictureUrl?: string | null }
): Promise<{ order: Order; isFirstConnect: boolean; welcomeCouponCode?: string }> {
  const order = await fetchOrderByCodeForAdmin(orderCode);
  if (!order) {
    throw new Error("Order not found");
  }

  const lineUserId = profile.userId.trim();
  if (!lineUserId) {
    throw new Error("LINE profile is missing user ID");
  }

  const alreadyLinked =
    order.customer.lineConnected && order.customer.lineUserId?.trim() === lineUserId;

  if (alreadyLinked) {
    return { order, isFirstConnect: false };
  }

  const supabase = createAdminSupabaseClient();
  const { error } = await supabase
    .from(TABLES.customers)
    .update({
      line_user_id: lineUserId,
      line_display_name: profile.displayName.trim() || null,
      line_picture_url: profile.pictureUrl?.trim() || null,
      line_connected: true
    })
    .eq("id", order.customer.id);

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  const updated = await fetchOrderByIdForAdmin(order.id);
  if (!updated) {
    throw new Error("Order not found after LINE link");
  }

  const { coupon } = await ensureWelcomeCouponForLineUser({
    lineUserId,
    customerId: updated.customer.id
  });

  return {
    order: updated,
    isFirstConnect: true,
    welcomeCouponCode: coupon.code
  };
}

export async function updateOrderStatusInDb(
  id: string,
  status: OrderStatus,
  options?: { scanDriveUrl?: string | null }
): Promise<Order> {
  const supabase = createAdminSupabaseClient();

  const patch: { status: OrderStatus; updated_at: string; scan_drive_url?: string | null } = {
    status,
    updated_at: nowIso()
  };

  if (options && "scanDriveUrl" in options) {
    patch.scan_drive_url = options.scanDriveUrl?.trim() || null;
  }

  const { error } = await supabase.from(TABLES.orders).update(patch).eq("id", id).select().single();

  if (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "PGRST116") {
      throw new Error(
        "Order status update blocked by database permissions (RLS). Set SUPABASE_SERVICE_ROLE_KEY or configure Supabase RLS policies for order tables."
      );
    }
    throw new Error(formatSupabaseError(error));
  }

  const order = await fetchOrderByIdForAdmin(id);
  if (!order) {
    throw new Error(`Order updated but could not be reloaded for id ${id}`);
  }
  return order;
}

export async function confirmOrderPaymentInDb(id: string): Promise<Order> {
  const supabase = createAdminSupabaseClient();
  const existing = await fetchOrderByIdForAdmin(id);
  if (!existing) {
    throw new Error("Order not found");
  }

  const patch: { payment_status: PaymentStatus; status?: OrderStatus; updated_at: string } = {
    payment_status: "paid",
    updated_at: nowIso()
  };

  if (existing.status === "Pending Payment Confirmation") {
    patch.status = "Received";
  }

  const { error } = await supabase.from(TABLES.orders).update(patch).eq("id", id);
  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  const { error: paymentError } = await supabase
    .from(TABLES.payments)
    .update({
      status: "paid",
      confirmed_at: nowIso()
    })
    .eq("order_id", id);

  if (paymentError) {
    throw new Error(formatSupabaseError(paymentError));
  }

  const order = await fetchOrderByIdForAdmin(id);
  if (!order) {
    throw new Error(`Payment confirmed but order could not be reloaded for id ${id}`);
  }
  return order;
}

export async function confirmOrderInDb(id: string): Promise<Order> {
  const supabase = createAdminSupabaseClient();
  const existing = await fetchOrderByIdForAdmin(id);
  if (!existing) {
    throw new Error("Order not found");
  }

  const { error } = await supabase
    .from(TABLES.orders)
    .update({
      status: "Received",
      updated_at: nowIso()
    })
    .eq("id", id);

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  const order = await fetchOrderByIdForAdmin(id);
  if (!order) {
    throw new Error(`Order confirmed but could not be reloaded for id ${id}`);
  }
  return order;
}

export async function fetchDashboardStatsFromDb() {
  const orders = await fetchOrdersForAdmin();
  return { stats: buildDashboardStats(orders), orders };
}

export async function fetchCustomersFromDb() {
  const orders = await fetchOrdersForAdmin();
  const customers = buildCustomerRows(orders);
  const lineUserIds = customers
    .map((customer) => customer.lineUserId)
    .filter((value): value is string => Boolean(value?.trim()));
  const coupons = await fetchCouponsByLineUserIds(lineUserIds);

  return customers.map((customer) => {
    const coupon = customer.lineUserId ? coupons.get(customer.lineUserId) : undefined;
    return {
      ...customer,
      welcomeCouponCode: coupon?.code ?? null,
      welcomeCouponExpiresAt: coupon?.expiresAt ?? null,
      welcomeCouponStatus: coupon ? getCouponStatusLabel(coupon) : null
    };
  });
}

export async function fetchPricingFromDb(): Promise<PricingSettings> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.pricingSettings)
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPricing(data) : defaultPricing;
}

export async function savePricingToDb(pricing: PricingSettings): Promise<PricingSettings> {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from(TABLES.pricingSettings)
    .upsert({ id: 1, ...pricingToDb(pricing) })
    .select("*")
    .single();

  if (error) throw error;
  return mapPricing(data);
}
