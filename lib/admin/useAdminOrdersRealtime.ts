"use client";

import { useEffect, useRef } from "react";
import { fetchAdminOrder } from "@/lib/admin/api";
import { playNewOrderNotificationSound } from "@/lib/admin/notification-sound";
import { showNewOrderToast } from "@/lib/admin/new-order-toast";
import { TABLES } from "@/lib/config/tables";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

type Options = {
  ready: boolean;
  orders: Order[];
  notify?: boolean;
  onNewOrder: (order: Order) => void;
  onOrderUpdated: (order: Order) => void;
};

export function useAdminOrdersRealtime({
  ready,
  orders,
  notify = true,
  onNewOrder,
  onOrderUpdated
}: Options) {
  const knownIdsRef = useRef<Set<string> | null>(null);
  const onNewOrderRef = useRef(onNewOrder);
  const onOrderUpdatedRef = useRef(onOrderUpdated);

  onNewOrderRef.current = onNewOrder;
  onOrderUpdatedRef.current = onOrderUpdated;

  useEffect(() => {
    if (!ready) return;

    if (knownIdsRef.current === null) {
      knownIdsRef.current = new Set(orders.map((order) => order.id));
    }
  }, [ready, orders]);

  useEffect(() => {
    if (!ready) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel("admin-orders-feed")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: TABLES.orders
        },
        (payload) => {
          const row = payload.new as { id?: string };
          const id = row.id;
          if (!id) return;

          if (knownIdsRef.current?.has(id)) return;
          knownIdsRef.current?.add(id);

          void fetchAdminOrder(id)
            .then(({ order }) => {
              onNewOrderRef.current(order);
              if (notify) {
                playNewOrderNotificationSound();
                showNewOrderToast(order);
              }
            })
            .catch((error) => {
              console.error("[admin realtime] failed to load new order", error);
            });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: TABLES.orders
        },
        (payload) => {
          const row = payload.new as { id?: string };
          const id = row.id;
          if (!id || !knownIdsRef.current?.has(id)) return;

          void fetchAdminOrder(id)
            .then(({ order }) => onOrderUpdatedRef.current(order))
            .catch((error) => {
              console.error("[admin realtime] failed to refresh order", error);
            });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [ready, notify]);
}
