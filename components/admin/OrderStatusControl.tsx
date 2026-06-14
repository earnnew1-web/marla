"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { patchAdminOrderStatus } from "@/lib/admin/api";
import { notifyAdminLineStatus, toastStatusUpdateWithLine } from "@/lib/admin/line-notification";
import { orderRequiresScanDriveUrl } from "@/lib/order-scan";
import { orderStatuses, orderStatusLabels } from "@/lib/options";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

export function OrderStatusControl({
  order,
  onUpdated
}: {
  order: Order;
  onUpdated: (order: Order) => void;
}) {
  const [value, setValue] = useState(order.status);
  const [scanDriveUrl, setScanDriveUrl] = useState(order.scanDriveUrl ?? "");
  const [loading, setLoading] = useState(false);
  const requiresScanUrl = orderRequiresScanDriveUrl(order);

  useEffect(() => {
    setValue(order.status);
    setScanDriveUrl(order.scanDriveUrl ?? "");
  }, [order.status, order.scanDriveUrl]);

  const updateStatus = async (next: OrderStatus) => {
    if (next === value) return;

    if (next === "Ready" && requiresScanUrl && !scanDriveUrl.trim()) {
      toast.error("Please enter the Google Drive URL before marking this scan order Ready.");
      return;
    }

    setLoading(true);
    try {
      const payload: { status: OrderStatus; scanDriveUrl?: string } = { status: next };
      if (requiresScanUrl && scanDriveUrl.trim()) {
        payload.scanDriveUrl = scanDriveUrl.trim();
      }

      const { order: updated } = await patchAdminOrderStatus(order.id, payload);
      setValue(updated.status);
      setScanDriveUrl(updated.scanDriveUrl ?? "");
      onUpdated(updated);
      const lineResult = await notifyAdminLineStatus(order.id);
      toastStatusUpdateWithLine(lineResult);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const saveScanDriveUrl = async () => {
    if (!scanDriveUrl.trim()) {
      toast.error("Please enter the Google Drive URL.");
      return;
    }

    setLoading(true);
    try {
      const { order: updated } = await patchAdminOrderStatus(order.id, {
        status: order.status,
        scanDriveUrl: scanDriveUrl.trim()
      });
      setScanDriveUrl(updated.scanDriveUrl ?? "");
      onUpdated(updated);
      toast.success("Google Drive link saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save Google Drive URL");
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
        {requiresScanUrl ? (
          <div className="rounded-lg border border-dashed border-accent/30 bg-accent/5 p-4">
            <Label htmlFor="scan-drive-url">Google Drive URL</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Required when marking a scan order as Ready so the customer receives their file link.
            </p>
            <Input
              id="scan-drive-url"
              className="mt-3 h-11"
              value={scanDriveUrl}
              placeholder="https://drive.google.com/..."
              onChange={(event) => setScanDriveUrl(event.target.value)}
              disabled={loading}
            />
            {value === "Ready" ? (
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                disabled={loading}
                onClick={saveScanDriveUrl}
              >
                Save Google Drive link
              </Button>
            ) : null}
          </div>
        ) : null}

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
