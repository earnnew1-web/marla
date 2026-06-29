"use client";

import Image from "next/image";
import { Fragment } from "react";
import {
  getConnectorState,
  getProgressActiveIndex,
  getStepState,
  MARLA_PROGRESS_RED,
  ORDER_PROGRESS_STEPS
} from "@/lib/order-progress";
import { useCustomerLanguage } from "@/lib/i18n/CustomerLanguageProvider";
import type { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import "./OrderProgressTracker.css";

type Props = {
  status: OrderStatus | string;
  className?: string;
  variant?: "default" | "compact";
};

export function OrderProgressTracker({ status, className, variant = "default" }: Props) {
  const { t } = useCustomerLanguage();
  const activeIndex = getProgressActiveIndex(status);
  const compact = variant === "compact";

  return (
    <div
      className={cn(
        "order-progress-track w-full px-1 pb-1 pt-2",
        compact && "order-progress-track--compact",
        className
      )}
    >
      <div className="order-progress-row mx-auto flex min-w-[min(100%,700px)] max-w-3xl justify-between overflow-visible">
        {ORDER_PROGRESS_STEPS.map((step, index) => {
          const stepState = getStepState(index, activeIndex);
          const connectorState =
            index < ORDER_PROGRESS_STEPS.length - 1 ? getConnectorState(index, activeIndex) : null;
          const label = t.timeline[step.labelKey];

          return (
            <Fragment key={step.status}>
              <div className="order-progress-step">
                <div
                  className={cn(
                    "order-progress-thumb",
                    compact && stepState !== "active" && "opacity-[0.28] saturate-[0.65]",
                    !compact && stepState === "future" && "opacity-[0.35] saturate-[0.8]"
                  )}
                >
                  <div
                    className={cn(
                      "order-progress-ring",
                      stepState === "active" && "order-progress-ring--active",
                      stepState === "completed" && "order-progress-ring--completed"
                    )}
                  >
                    <div className="order-progress-image-wrapper">
                      <Image
                        src={step.image}
                        alt={label}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                <p
                  className={cn(
                    "order-progress-label text-[10px] sm:text-[11px]",
                    stepState === "active" && "font-bold text-[#D3322B]",
                    !compact && stepState === "completed" && "font-medium text-foreground/85",
                    !compact && stepState === "future" && "font-normal text-muted-foreground/70",
                    compact && stepState !== "active" && "font-normal text-muted-foreground/55"
                  )}
                >
                  {label}
                </p>
              </div>

              {connectorState ? (
                <div
                  className="order-progress-connector-wrap w-[clamp(8px,4vw,28px)] px-0.5"
                  aria-hidden
                >
                  <div
                    className={cn(
                      "order-progress-connector w-full",
                      connectorState === "completed" && "order-progress-connector--completed",
                      connectorState === "active" && "order-progress-connector--active"
                    )}
                  />
                </div>
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

export { MARLA_PROGRESS_RED };
