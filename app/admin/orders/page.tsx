"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";
import { AdminStatusTabs } from "@/components/admin/AdminStatusTabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { filterOrders } from "@/lib/admin/filters";
import { fetchAdminOrders } from "@/lib/admin/api";
import type { AdminStatusFilter } from "@/lib/options";
import type { Order } from "@/lib/types";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AdminStatusFilter>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminOrders()
      .then(({ orders: nextOrders }) => setOrders(nextOrders))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => filterOrders(orders, { query, status }), [orders, query, status]);

  const handleOrderUpdated = (updated: Order) => {
    setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Orders</p>
        <h1 className="mt-2 text-3xl font-bold">Order management</h1>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <Input
            placeholder="Search order code, customer, or phone"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <AdminStatusTabs value={status} onChange={setStatus} />
        </CardHeader>
      </Card>

      <Card className="mt-5 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : null}
          {error ? <p className="p-5 text-sm font-semibold text-destructive">{error}</p> : null}

          {!loading && !error ? (
            filtered.length ? (
              <AdminOrdersTable
                orders={filtered}
                onOrderUpdated={handleOrderUpdated}
                updatingId={updatingId}
                onLoadingChange={setUpdatingId}
              />
            ) : (
              <p className="p-5 text-sm text-muted-foreground">No orders match your filters.</p>
            )
          ) : null}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
