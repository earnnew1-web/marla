"use client";

import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { patchAdminOrderStatus } from "@/lib/admin/api";
import { notifyAdminLineStatus } from "@/lib/admin/line-notification";
import { orderStatuses, orderStatusLabels } from "@/lib/options";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

export function OrderStatusControl({
  orderId,
  status,
  onUpdated
}: {
  orderId: string;
  status: OrderStatus;
  onUpdated: (status: OrderStatus) => void;
}) {
  const [value, setValue] = useState(status);
  const [loading, setLoading] = useState(false);

  const updateStatus = async (next: OrderStatus) => {
    setLoading(true);
    try {
      const { order } = await patchAdminOrderStatus(orderId, next);
      setValue(order.status);
      onUpdated(order.status);
      toast.success("Status updated");
      void notifyAdminLineStatus(orderId, order.status);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardDescription className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Status management
          </CardDescription>
          <CardTitle className="mt-1 text-2xl">Update order status</CardTitle>
          <CardDescription className="mt-2">
            Pending Payment Confirmation → Received → Developing+Scanning → Ready → Completed
          </CardDescription>
        </div>
        <StatusBadge status={value} />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {orderStatuses.map((option) => (
            <Button
              key={option}
              type="button"
              variant={value === option ? "default" : "outline"}
              disabled={loading}
              className={cn("min-h-12 h-auto whitespace-normal text-left font-semibold", value === option && "shadow-sm")}
              onClick={() => updateStatus(option)}
            >
              <span className="block">{orderStatusLabels[option].en}</span>
              <span className="mt-0.5 block text-xs font-medium opacity-70">{orderStatusLabels[option].th}</span>
            </Button>
          ))}
        </div>

        <div>
          <Label htmlFor="order-status-select">Quick change</Label>
          <Select value={value} onValueChange={(next) => updateStatus(next as OrderStatus)} disabled={loading}>
            <SelectTrigger id="order-status-select" className="mt-2 max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {orderStatuses.map((option) => (
                <SelectItem key={option} value={option}>
                  {orderStatusLabels[option].en} · {orderStatusLabels[option].th}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loading ? <p className="mt-2 text-sm font-medium text-muted-foreground">Updating status...</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
