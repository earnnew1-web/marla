"use client";

import { isBetaEnv } from "@/lib/config/env";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "customer" | "admin";
  className?: string;
};

export function BetaBadge({ variant = "customer", className }: Props) {
  if (!isBetaEnv()) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent",
        className
      )}
    >
      {variant === "admin" ? "Beta Admin" : "Beta"}
    </span>
  );
}
