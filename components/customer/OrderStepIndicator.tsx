"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const STEP_ROUTES = [
  "/order/customer-info",
  "/order/film-rolls",
  "/order/payment"
] as const;

const STEP_COUNT = STEP_ROUTES.length;

const TAB_CLIP =
  "clip-path-[polygon(6%_0,94%_0,100%_100%,0_100%)] sm:clip-path-[polygon(5%_0,95%_0,100%_100%,0_100%)]";

type Props = {
  current: number;
  children?: React.ReactNode;
};

function tabZIndex(stepNumber: number, current: number, active: boolean, completed: boolean) {
  if (active) return 30;
  if (completed) return 18 + stepNumber;
  return Math.max(1, 12 - (stepNumber - current));
}

export function OrderStepIndicator({ current, children }: Props) {
  const router = useRouter();

  return (
    <div className="mx-auto mb-6 w-full max-w-2xl">
      <div
        className="relative flex items-end gap-0.5 px-0.5 sm:gap-1"
        role="tablist"
        aria-label="Order progress"
      >
        {STEP_ROUTES.map((route, index) => {
          const stepNumber = index + 1;
          const active = stepNumber === current;
          const completed = stepNumber < current;
          const upcoming = stepNumber > current;
          const label = String(stepNumber).padStart(2, "0");

          return (
            <button
              key={route}
              type="button"
              role="tab"
              aria-selected={active}
              aria-current={active ? "step" : undefined}
              disabled={upcoming}
              onClick={() => {
                if (completed) router.push(route);
              }}
              style={{ zIndex: tabZIndex(stepNumber, current, active, completed) }}
              className={cn(
                "relative flex min-w-0 flex-1 items-center justify-center tabular-nums transition-all duration-200",
                TAB_CLIP,
                "text-sm font-semibold sm:text-[15px]",
                active && [
                  "h-10 bg-card text-foreground sm:h-11",
                  "shadow-[0_-2px_10px_rgba(37,29,24,0.05)]",
                  "after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-1.5 after:bg-card"
                ],
                completed &&
                  !active && [
                    "h-9 cursor-pointer bg-[#ebe7e3] text-foreground/55 sm:h-10",
                    "shadow-[inset_0_-1px_0_rgba(37,29,24,0.06)]",
                    "hover:bg-[#e3dfda] hover:text-foreground/72"
                  ],
                upcoming && ["h-9 cursor-default bg-[#f3f0ec] text-muted-foreground/42 sm:h-10"]
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {children ? (
        <div
          className={cn(
            "relative z-20 -mt-px overflow-hidden rounded-b-2xl rounded-tr-2xl bg-card shadow-soft",
            current === 1 ? "rounded-tl-none" : "rounded-tl-2xl"
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export { STEP_COUNT, STEP_ROUTES };
