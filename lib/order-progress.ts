import type { OrderStatus } from "@/lib/types";
import { normalizeStatusValue } from "@/lib/admin/status-styles";

export const MARLA_PROGRESS_RED = "#D3322B";

export const ORDER_PROGRESS_STEPS = [
  {
    status: "Received" as const,
    image: "/images/order-progress/receive.png",
    labelKey: "progressReceive" as const
  },
  {
    status: "Developing+Scanning" as const,
    image: "/images/order-progress/developing.png",
    labelKey: "progressDeveloping" as const
  },
  {
    status: "Ready" as const,
    image: "/images/order-progress/ready.png",
    labelKey: "progressReady" as const
  },
  {
    status: "Completed" as const,
    image: "/images/order-progress/complete.png",
    labelKey: "progressComplete" as const
  }
] as const;

export type ProgressStepState = "completed" | "active" | "future";
export type ConnectorState = "completed" | "active" | "future";

const TRACKED_STATUSES = ORDER_PROGRESS_STEPS.map((step) => step.status);

export function getProgressActiveIndex(status: OrderStatus | string): number {
  const normalized = normalizeStatusValue(status);
  const index = TRACKED_STATUSES.indexOf(normalized as (typeof TRACKED_STATUSES)[number]);
  return index >= 0 ? index : 0;
}

export function getStepState(stepIndex: number, activeIndex: number): ProgressStepState {
  if (stepIndex < activeIndex) return "completed";
  if (stepIndex === activeIndex) return "active";
  return "future";
}

export function getConnectorState(lineIndex: number, activeIndex: number): ConnectorState {
  if (lineIndex < activeIndex) return "completed";
  if (lineIndex === activeIndex && activeIndex < ORDER_PROGRESS_STEPS.length - 1) return "active";
  return "future";
}
