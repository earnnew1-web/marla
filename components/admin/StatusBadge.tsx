import { Badge } from "@/components/ui/badge";
import { normalizeStatusValue, statusClassName } from "@/lib/admin/status-styles";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: OrderStatus | string }) {
  const normalized = normalizeStatusValue(status);

  return (
    <Badge variant="outline" className={cn("font-semibold", statusClassName(normalized))}>
      {normalized}
    </Badge>
  );
}
