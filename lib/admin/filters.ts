import { normalizeStatus } from "@/lib/db/mappers";
import type { Order } from "@/lib/types";

export function filterOrders(
  orders: Order[],
  options: { query?: string; status?: string }
) {
  const query = options.query?.trim().toLowerCase() ?? "";
  return orders
    .filter((order) => {
      if (!options.status || options.status === "All") return true;
      if (options.status === "Developing+Scanning") {
        return order.status === "Developing+Scanning" || normalizeStatus(order.status) === "Developing+Scanning";
      }
      return order.status === options.status;
    })
    .filter((order) => {
      if (!query) return true;
      const haystack = `${order.orderCode} ${order.customer.name} ${order.customer.phone}`.toLowerCase();
      return haystack.includes(query);
    });
}
