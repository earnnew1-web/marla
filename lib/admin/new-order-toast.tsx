"use client";

import { toast } from "sonner";
import type { Order } from "@/lib/types";

export function showNewOrderToast(order: Order) {
  toast.success("New order received", {
    description: `${order.orderCode} · ${order.customer.name} · ${order.customer.phone}`,
    duration: Infinity,
    closeButton: true,
    action: {
      label: "View",
      onClick: () => {
        window.location.href = `/admin/orders/${order.id}`;
      }
    }
  });
}
