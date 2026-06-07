import { orderStatuses } from "@/lib/options";
import type { OrderStatus } from "@/lib/types";

export const statusStyles: Record<OrderStatus, string> = {
  "Pending Payment Confirmation":
    "rounded-full border-amber-400/40 bg-amber-50 text-amber-950 hover:bg-amber-50",
  Received:
    "rounded-full border-border bg-status-received text-foreground hover:bg-status-received",
  "Developing+Scanning":
    "rounded-full border-amber-400/40 bg-status-progress text-amber-950 hover:bg-status-progress",
  Ready:
    "rounded-full border-emerald-400/40 bg-status-ready text-emerald-950 hover:bg-status-ready",
  Completed:
    "rounded-full border-emerald-300/30 bg-status-completed text-muted-foreground hover:bg-status-completed",
  Cancelled:
    "rounded-full border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/10"
};

const STATUS_ALIASES: Record<string, OrderStatus> = {
  pending_payment_confirmation: "Pending Payment Confirmation",
  "pending payment confirmation": "Pending Payment Confirmation",
  received: "Received",
  developing_scanning: "Developing+Scanning",
  "developing+scanning": "Developing+Scanning",
  developing: "Developing+Scanning",
  scanning: "Developing+Scanning",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
  canceled: "Cancelled"
};

function toAliasKey(status: string) {
  return status.trim().toLowerCase().replace(/\s+/g, " ").replace(/\+/g, "+");
}

export function normalizeStatusValue(status: OrderStatus | string): OrderStatus {
  const trimmed = String(status).trim();
  if (!trimmed) return "Received";

  const alias = STATUS_ALIASES[toAliasKey(trimmed)] ?? STATUS_ALIASES[trimmed.toLowerCase()];
  if (alias) return alias;

  if (trimmed === "Developing" || trimmed === "Scanning") return "Developing+Scanning";
  if (orderStatuses.includes(trimmed as OrderStatus)) return trimmed as OrderStatus;

  return trimmed as OrderStatus;
}

export function statusClassName(status: OrderStatus | string) {
  const normalized = normalizeStatusValue(status);
  return statusStyles[normalized] ?? statusStyles.Received;
}
