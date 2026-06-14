"use client";

import { useEffect, useRef } from "react";
import { normalizeStatus } from "@/lib/db/mappers";
import { TABLES } from "@/lib/config/tables";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { OrderStatus } from "@/lib/types";

type OrderRow = {
  status?: string;
  scan_drive_url?: string | null;
};

export type OrderRealtimeUpdate = {
  status: OrderStatus;
  scanDriveUrl?: string | null;
};

export function useOrderStatusRealtime(
  orderId: string | null | undefined,
  onUpdate: (update: OrderRealtimeUpdate) => void
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!orderId) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: TABLES.orders,
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          const row = payload.new as OrderRow;
          if (typeof row.status !== "string") return;

          onUpdateRef.current({
            status: normalizeStatus(row.status),
            scanDriveUrl: row.scan_drive_url ?? null
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orderId]);
}
