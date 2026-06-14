import { TABLES } from "@/lib/config/tables";
import { defaultPricing } from "@/lib/pricing";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase/server";
import type { DraftOrder, Order, OrderStatus, PaymentStatus, PricingSettings } from "@/lib/types";
import {
  buildCustomerRows,
  buildDashboardStats,
  draftToDbPayload,
  getOrderSelect,
  mapOrder,
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
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  let next = 1026;
  const latest = data?.[0]?.order_code;
  if (latest) {
    const number = Number(String(latest).replace("MFL-", ""));
    if (Number.isFinite(number)) next = number + 1;
  }

  return `MFL-${next}`;
}

export async function createOrderInDb(draft: DraftOrder): Promise<Order> {
  const supabase = createAdminSupabaseClient();
  const payload = draftToDbPayload(draft);
  const orderCode = await generateOrderCode(supabase);

  const { data: customerRow, error: customerError } = await supabase
    .from(TABLES.customers)
    .insert(payload.customer)
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

  const { error: rollsError } = await supabase.from(TABLES.filmRolls).insert(rollsPayload);
  if (rollsError) {
    throw new Error(formatSupabaseError(rollsError));
  }

  const { error: paymentError } = await supabase.from(TABLES.payments).insert({
    ...payload.payment,
    order_id: orderRow.id
  });

  if (paymentError) {
    throw new Error(formatSupabaseError(paymentError));
  }

  const order = await fetchOrderByIdForAdmin(orderRow.id);
  if (!order) {
    throw new Error("Order created but could not be loaded");
  }
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

export async function updateOrderStatusInDb(id: string, status: OrderStatus): Promise<Order> {
  const supabase = createAdminSupabaseClient();

  const { error } = await supabase
    .from(TABLES.orders)
    .update({ status, updated_at: nowIso() })
    .eq("id", id)
    .select()
    .single();

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
  return buildCustomerRows(orders);
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
