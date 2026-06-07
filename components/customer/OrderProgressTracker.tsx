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
};

export function OrderProgressTracker({ status, className }: Props) {
  const { t } = useCustomerLanguage();
  const activeIndex = getProgressActiveIndex(status);

  return (
    <div className={cn("order-progress-track w-full px-2 pb-2 pt-4", className)}>
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
                    stepState === "future" && "opacity-[0.35] saturate-[0.8]"
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
                        width={120}
                        height={120}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                <p
                  className={cn(
                    "order-progress-label text-[10px] sm:text-xs",
                    stepState === "active" && "font-bold text-[#D3322B]",
                    stepState === "completed" && "font-medium text-foreground/85",
                    stepState === "future" && "font-normal text-muted-foreground/70"
                  )}
                >
                  {label}
                </p>
              </div>

              {connectorState ? (
                <div
                  className="order-progress-connector-wrap w-[clamp(10px,6vw,40px)] px-0.5"
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
