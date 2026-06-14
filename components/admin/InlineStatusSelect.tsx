"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { patchAdminOrderStatus } from "@/lib/admin/api";
import { notifyAdminLineStatus } from "@/lib/admin/line-notification";
import { statusClassName, normalizeStatusValue } from "@/lib/admin/status-styles";
import { orderStatuses, orderStatusLabels } from "@/lib/options";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

export function InlineStatusSelect({
  orderId,
  status,
  onUpdated,
  onLoadingChange
}: {
  orderId: string;
  status: OrderStatus;
  onUpdated: (order: Order) => void;
  onLoadingChange?: (loading: boolean) => void;
}) {
  const [value, setValue] = useState(normalizeStatusValue(status));
  const [phase, setPhase] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    setValue(normalizeStatusValue(status));
  }, [status]);

  const updateStatus = async (next: OrderStatus) => {
    if (next === value) return;

    const previous = value;
    setValue(next);
    setPhase("loading");
    onLoadingChange?.(true);

    try {
      const { order } = await patchAdminOrderStatus(orderId, next);
      setValue(normalizeStatusValue(order.status));
      setPhase("success");
      onUpdated(order);
      void notifyAdminLineStatus(orderId, order.status);
      window.setTimeout(() => setPhase("idle"), 1200);
    } catch (error) {
      setValue(previous);
      setPhase("error");
      const message = error instanceof Error ? error.message : "Failed to update status";
      toast.error(message);
      window.setTimeout(() => setPhase("idle"), 1200);
    } finally {
      onLoadingChange?.(false);
    }
  };

  return (
    <Select value={value} onValueChange={(next) => updateStatus(next as OrderStatus)} disabled={phase === "loading"}>
      <SelectTrigger
        aria-label="Update order status"
        className={cn(
          "h-auto w-auto max-w-[11rem] rounded-full border px-3 py-1 text-xs font-semibold shadow-none focus:ring-2 focus:ring-ring disabled:cursor-wait",
          statusClassName(value),
          phase === "success" && "ring-2 ring-emerald-400/50",
          phase === "error" && "ring-2 ring-destructive/40"
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {orderStatuses.map((option) => (
          <SelectItem key={option} value={option}>
            {orderStatusLabels[option].en}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
