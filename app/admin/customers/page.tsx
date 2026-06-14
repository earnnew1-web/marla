"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { fetchAdminCustomers } from "@/lib/admin/api";
import { shortDate } from "@/lib/format";
import type { AdminCustomerRow } from "@/lib/types";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomerRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAdminCustomers()
      .then(({ customers: nextCustomers }) => setCustomers(nextCustomers))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load customers"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return customers;
    return customers.filter((customer) =>
      `${customer.name} ${customer.phone} ${customer.lineDisplayName ?? customer.lineId} ${customer.email}`.toLowerCase().includes(value)
    );
  }, [customers, query]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Customers</p>
        <h1 className="mt-2 text-3xl font-bold">Customer database</h1>
      </div>

      <Card>
        <CardHeader>
          <Input
            placeholder="Search name or phone"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </CardHeader>
      </Card>

      <Card className="mt-5 overflow-hidden">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>LINE ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>Last Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((customer) => (
                  <TableRow key={customer.phone}>
                    <TableCell className="font-semibold">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>
                      {customer.lineConnected
                        ? customer.lineId || customer.lineDisplayName || "Connected"
                        : customer.lineId || "—"}
                    </TableCell>
                    <TableCell>{customer.email || "—"}</TableCell>
                    <TableCell>{customer.orderCount}</TableCell>
                    <TableCell>{shortDate(customer.lastOrderAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
