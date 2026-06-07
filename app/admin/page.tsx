"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";
import { AdminStatusTabs } from "@/components/admin/AdminStatusTabs";
import { DashboardStatCard } from "@/components/admin/DashboardStatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { filterOrders } from "@/lib/admin/filters";
import { fetchAdminDashboard } from "@/lib/admin/api";
import { buildDashboardStats } from "@/lib/db/mappers";
import type { AdminStatusFilter } from "@/lib/options";
import type { Order } from "@/lib/types";

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ newToday: 0, inProgress: 0, ready: 0, completedToday: 0 });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<AdminStatusFilter>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminDashboard()
      .then(({ stats: nextStats, orders: nextOrders }) => {
        setStats(nextStats);
        setOrders(nextOrders);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => filterOrders(orders, { query, status }), [orders, query, status]);

  const handleOrderUpdated = (updated: Order) => {
    setOrders((current) => {
      const nextOrders = current.map((order) => (order.id === updated.id ? updated : order));
      setStats(buildDashboardStats(nextOrders));
      return nextOrders;
    });
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Operations</p>
        <h1 className="mt-2 text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">Live queue from Supabase.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard label="New Orders Today" value={String(stats.newToday)} detail="Submitted today" />
        <DashboardStatCard label="In Progress" value={String(stats.inProgress)} detail="Developing+Scanning" />
        <DashboardStatCard label="Ready" value={String(stats.ready)} detail="Waiting for pickup/delivery" />
        <DashboardStatCard label="Completed Today" value={String(stats.completedToday)} detail="Finished today" />
      </div>

      <Card className="mt-6 overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <CardTitle className="text-xl">Order queue</CardTitle>
              <CardDescription className="mt-1">Newest first</CardDescription>
            </div>
            <Input
              className="max-w-md"
              placeholder="Search order code, customer, phone"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="mt-4">
            <AdminStatusTabs value={status} onChange={setStatus} />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
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
                actionLabel="Detail"
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
