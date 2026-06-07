"use client";

import Link from "next/link";
import { InlineStatusSelect } from "@/components/admin/InlineStatusSelect";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  formatFilmDeliveryMethod,
  formatPaymentMethod,
  formatPaymentStatus,
  formatReturnMethod
} from "@/lib/admin/order-labels";
import { money, shortDate } from "@/lib/format";
import type { Order } from "@/lib/types";

type Props = {
  orders: Order[];
  onOrderUpdated: (order: Order) => void;
  updatingId?: string | null;
  onLoadingChange?: (orderId: string | null) => void;
  actionLabel?: string;
};

export function AdminOrdersTable({
  orders,
  onOrderUpdated,
  updatingId = null,
  onLoadingChange,
  actionLabel = "View Detail"
}: Props) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order Code</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Pay Status</TableHead>
            <TableHead>Order Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Film Delivery</TableHead>
            <TableHead>Return</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id} className={updatingId === order.id ? "opacity-60" : undefined}>
              <TableCell className="font-bold whitespace-nowrap">{order.orderCode}</TableCell>
              <TableCell>{order.customer.name}</TableCell>
              <TableCell className="whitespace-nowrap">{order.customer.phone}</TableCell>
              <TableCell>{formatPaymentMethod(order.payment?.method)}</TableCell>
              <TableCell>{formatPaymentStatus(order.payment?.status)}</TableCell>
              <TableCell>
                <InlineStatusSelect
                  orderId={order.id}
                  status={order.status}
                  onUpdated={onOrderUpdated}
                  onLoadingChange={(isLoading) => onLoadingChange?.(isLoading ? order.id : null)}
                />
              </TableCell>
              <TableCell className="whitespace-nowrap">{money(order.totalPrice)}</TableCell>
              <TableCell className="whitespace-nowrap">{shortDate(order.createdAt)}</TableCell>
              <TableCell>{formatFilmDeliveryMethod(order.filmDeliveryMethod)}</TableCell>
              <TableCell>{formatReturnMethod(order.returnMethod)}</TableCell>
              <TableCell>
                <Link className="font-semibold text-accent hover:underline whitespace-nowrap" href={`/admin/orders/${order.id}`}>
                  {actionLabel}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
