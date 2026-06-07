"use client";

import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  description: string;
  className?: string;
};

export function FieldInfoTooltip({ title, description, className }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground/65 transition hover:bg-accent/[0.06] hover:text-foreground/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
            className
          )}
          aria-label={title}
          onClick={(event) => event.stopPropagation()}
        >
          <Info size={16} strokeWidth={2.25} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        className="max-w-[min(20rem,calc(100vw-2rem))] rounded-xl border-border/70 bg-card p-4 shadow-soft"
      >
        <p className="text-sm font-semibold leading-snug text-foreground">{title}</p>
        <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{description}</p>
      </PopoverContent>
    </Popover>
  );
}
