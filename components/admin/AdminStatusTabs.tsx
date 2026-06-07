"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminStatusFilter } from "@/lib/options";
import { adminStatusFilters } from "@/lib/options";

export function AdminStatusTabs({
  value,
  onChange
}: {
  value: AdminStatusFilter;
  onChange: (value: AdminStatusFilter) => void;
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as AdminStatusFilter)}>
      <TabsList className="h-auto flex-wrap justify-start gap-1">
        {adminStatusFilters.map((status) => (
          <TabsTrigger key={status} value={status} className="text-xs sm:text-sm">
            {status}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
